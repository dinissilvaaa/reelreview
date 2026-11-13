// ============================================================================
// controllers/movieController.ts
// CRUD + search/filter/sort/pagination for movies.
// Reading is public; creating, updating and deleting are admin-only
// (enforced in routes/movieRoutes.ts).
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import { Movie } from '../models/Movie'; // Movie model
import { Review } from '../models/Review'; // Needed to delete a movie's reviews
import { GENRES, isGenre, type Genre } from '../constants/genres'; // Allowed genres
import { HttpError } from '../utils/HttpError'; // Error with HTTP status
import { escapeRegex, parsePositiveInt, queryString } from '../utils/query'; // Query-string helpers
import { normalizeMovieInput, validateMovieInput } from '../utils/validators'; // Input checks
import { deleteLocalPoster, removeUploadedFile } from '../utils/files'; // Poster file cleanup
import { getAuthUser } from '../middleware/auth'; // Reads req.user safely

// Allowed values for ?sort=... and the MongoDB sort they map to (-1 = descending, 1 = ascending)
const SORT_OPTIONS = {
  newest: { createdAt: -1, _id: -1 }, // Recently added first (default)
  rating: { averageRating: -1, reviewCount: -1, _id: -1 }, // Best rated first
  popular: { reviewCount: -1, averageRating: -1, _id: -1 }, // Most reviewed first
  year: { releaseYear: -1, _id: -1 }, // Newest release year first
  title: { title: 1, _id: 1 }, // Alphabetical A-Z
} as const; // `_id` is a tie-breaker so pagination order is always stable

type SortKey = keyof typeof SORT_OPTIONS; // 'newest' | 'rating' | 'popular' | 'year' | 'title'

/**
 * GET /api/movies?search=&genre=&sort=&page=&limit=
 * Public. Returns one page of movies plus pagination info.
 * 200 -> { movies, page, limit, total, totalPages }   400 -> bad genre/sort
 */
export async function getMovies(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = queryString(req.query.search)?.trim() ?? ''; // Text typed in the search box
    const genre = queryString(req.query.genre)?.trim() ?? ''; // Selected genre ('' = all)
    const sort = queryString(req.query.sort) ?? 'newest'; // Sort option (default newest)
    const page = parsePositiveInt(req.query.page, 1, 10_000); // Page number (starts at 1)
    const limit = parsePositiveInt(req.query.limit, 12, 50); // Movies per page (max 50)

    if (search.length > 100) throw new HttpError(400, 'Search text must have at most 100 characters'); // Protect the DB
    if (genre && !isGenre(genre)) throw new HttpError(400, `Unknown genre "${genre}"`); // Only known genres
    if (!Object.hasOwn(SORT_OPTIONS, sort)) {
      throw new HttpError(400, `Sort must be one of: ${Object.keys(SORT_OPTIONS).join(', ')}`); // Only known sorts
    }

    const filter: Record<string, unknown> = {}; // MongoDB filter, built step by step
    if (search) {
      const pattern = new RegExp(escapeRegex(search), 'i'); // Case-insensitive "contains" match
      filter.$or = [{ title: pattern }, { director: pattern }]; // Match the title OR the director
    }
    if (genre) filter.genres = genre; // Movies whose genres array contains this genre

    // Run the page query and the total count in parallel (faster than one after the other)
    const [movies, total] = await Promise.all([
      Movie.find(filter) // Apply the filter
        .sort(SORT_OPTIONS[sort as SortKey]) // Apply the chosen order
        .skip((page - 1) * limit) // Skip the previous pages
        .limit(limit), // Take one page
      Movie.countDocuments(filter), // Total number of matches (for the pagination UI)
    ]);

    res.status(200).json({
      movies, // Movies of this page
      page, // Current page
      limit, // Page size
      total, // Total matches
      totalPages: Math.max(1, Math.ceil(total / limit)), // At least 1 page, even when empty
    });
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * GET /api/movies/genres
 * Public. Returns the list of allowed genres (used by the filter and admin form).
 * 200 -> { genres }
 */
export function getGenres(_req: Request, res: Response): void {
  res.status(200).json({ genres: GENRES }); // Static list, no database needed
}

/**
 * GET /api/movies/:id
 * Public. Returns one movie.
 * 200 -> { movie }   404 -> not found
 */
export async function getMovieById(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movie = await Movie.findById(req.params.id); // Look up by _id
    if (!movie) throw new HttpError(404, 'Movie not found'); // No such movie
    res.status(200).json({ movie }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * POST /api/movies  (admin only, JSON or multipart/form-data with an optional "poster" file)
 * 201 -> { movie }   400 -> invalid input   401/403 -> not admin
 */
export async function createMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = getAuthUser(req); // The admin creating the movie
    const input = normalizeMovieInput(req.body); // Strings from forms -> proper types
    const errors = validateMovieInput(input); // Full validation (all required fields)
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    const movie = await Movie.create({
      title: input.title, // Validated title
      description: input.description, // Validated description
      director: input.director, // Validated director
      releaseYear: input.releaseYear, // Validated year
      durationMinutes: input.durationMinutes ?? undefined, // null -> not stored
      genres: input.genres as Genre[], // Validated genres
      posterUrl: req.file ? `/uploads/${req.file.filename}` : (input.posterUrl ?? ''), // Uploaded file wins over a URL
      createdBy: admin.id, // Remember who created it
    });

    res.status(201).json({ movie }); // 201 Created
  } catch (error) {
    await removeUploadedFile(req.file); // Do not keep an image for a movie that was not created
    next(error); // Let the error handler build the response
  }
}

/**
 * PUT /api/movies/:id  (admin only, JSON or multipart/form-data)
 * Only the fields that are sent are changed.
 * 200 -> { movie }   400 -> invalid input   404 -> not found
 */
export async function updateMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movie = await Movie.findById(req.params.id); // Load the current version
    if (!movie) throw new HttpError(404, 'Movie not found'); // No such movie

    const input = normalizeMovieInput(req.body); // Strings from forms -> proper types
    if (input.posterUrl !== undefined && input.posterUrl === movie.posterUrl) delete input.posterUrl; // Unchanged poster -> ignore
    const errors = validateMovieInput(input, { partial: true }); // Only validate the fields that were sent
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    const previousPoster = movie.posterUrl; // Remember it so the old file can be deleted afterwards

    if (input.title !== undefined) movie.title = input.title; // Update title
    if (input.description !== undefined) movie.description = input.description; // Update description
    if (input.director !== undefined) movie.director = input.director; // Update director
    if (input.releaseYear !== undefined) movie.releaseYear = input.releaseYear; // Update year
    if (input.durationMinutes !== undefined) movie.durationMinutes = input.durationMinutes ?? undefined; // null -> remove
    if (input.genres !== undefined) movie.genres = input.genres as Genre[]; // Update genres
    if (req.file) movie.posterUrl = `/uploads/${req.file.filename}`; // New uploaded poster
    else if (input.posterUrl !== undefined) movie.posterUrl = input.posterUrl; // New URL ('' removes the poster)

    await movie.save(); // Runs the schema validators again and writes to MongoDB

    if (movie.posterUrl !== previousPoster) await deleteLocalPoster(previousPoster); // Clean up the replaced file
    res.status(200).json({ movie }); // 200 OK
  } catch (error) {
    await removeUploadedFile(req.file); // Failed update -> discard the new image
    next(error); // Let the error handler build the response
  }
}

/**
 * DELETE /api/movies/:id  (admin only)
 * Also deletes every review of the movie and its uploaded poster.
 * 200 -> { message, id }   404 -> not found
 */
export async function deleteMovie(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movie = await Movie.findById(req.params.id); // Load it first (we need its poster)
    if (!movie) throw new HttpError(404, 'Movie not found'); // No such movie

    await Review.deleteMany({ movie: movie._id }); // Remove its reviews (no orphans)
    await movie.deleteOne(); // Remove the movie itself
    await deleteLocalPoster(movie.posterUrl); // Remove the poster file (if it was uploaded)

    res.status(200).json({ message: 'Movie deleted successfully', id: movie._id }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}
