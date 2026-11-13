// ============================================================================
// controllers/reviewController.ts
// Create, read, update and delete reviews.
//   - Anyone can read the reviews of a movie.
//   - Logged-in users can write ONE review per movie and edit their own.
//   - Authors and admins can delete a review (admins moderate content).
// After every change the movie's average rating is recalculated.
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import { Movie } from '../models/Movie'; // Movie model
import { Review } from '../models/Review'; // Review model
import { HttpError } from '../utils/HttpError'; // Error with HTTP status
import { validateReviewInput } from '../utils/validators'; // Input checks
import { updateMovieRating } from '../utils/movieStats'; // Average rating recalculation
import { getAuthUser } from '../middleware/auth'; // Reads req.user safely

/**
 * GET /api/movies/:movieId/reviews
 * Public. Newest reviews first, with the author's username.
 * 200 -> { reviews }   404 -> movie not found
 */
export async function getMovieReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const movieId = String(req.params.movieId); // Movie id from the URL
    const movieExists = await Movie.exists({ _id: movieId }); // Cheap existence check
    if (!movieExists) throw new HttpError(404, 'Movie not found'); // No such movie

    const reviews = await Review.find({ movie: movieId }) // All reviews of this movie
      .populate('user', 'username') // Replace the user id by { _id, username }
      .sort({ createdAt: -1 }); // Newest first

    res.status(200).json({ reviews }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * POST /api/movies/:movieId/reviews  (logged-in users)
 * Body: { rating: 1-5, comment?: string }
 * 201 -> { review }   400 -> invalid   404 -> movie not found   409 -> already reviewed
 */
export async function createReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getAuthUser(req); // The author
    const movieId = String(req.params.movieId); // Movie id from the URL

    const { errors, value } = validateReviewInput(req.body); // Check rating + comment
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    const movieExists = await Movie.exists({ _id: movieId }); // Is it a real movie?
    if (!movieExists) throw new HttpError(404, 'Movie not found'); // No such movie

    const alreadyReviewed = await Review.exists({ movie: movieId, user: user.id }); // One review per user per movie
    if (alreadyReviewed) throw new HttpError(409, 'You have already reviewed this movie. Edit your review instead.'); // 409 Conflict

    const review = await Review.create({
      movie: movieId, // Reviewed movie
      user: user.id, // Author
      rating: value.rating, // 1-5
      comment: value.comment ?? '', // Optional text
    });

    await updateMovieRating(movieId); // Refresh the movie's average and count
    await review.populate('user', 'username'); // Include the author's name in the response

    res.status(201).json({ review }); // 201 Created
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * GET /api/reviews/me  (logged-in users)
 * Every review written by the current user, with basic movie info.
 * 200 -> { reviews }
 */
export async function getMyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getAuthUser(req); // Current user
    const reviews = await Review.find({ user: user.id }) // Only my reviews
      .populate('movie', 'title posterUrl releaseYear genres') // Replace the movie id by a small movie object
      .sort({ updatedAt: -1 }); // Most recently edited first

    res.status(200).json({ reviews }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * PUT /api/reviews/:id  (author only)
 * Body: { rating?, comment? }
 * 200 -> { review }   400 -> invalid   403 -> not the author   404 -> not found
 */
export async function updateReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getAuthUser(req); // Current user
    const review = await Review.findById(req.params.id); // Load the review
    if (!review) throw new HttpError(404, 'Review not found'); // No such review
    if (review.user.toString() !== user.id) throw new HttpError(403, 'You can only edit your own reviews'); // Not the author

    const { errors, value } = validateReviewInput(req.body, { partial: true }); // Only check the fields sent
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    if (value.rating !== undefined) review.rating = value.rating; // Update rating
    if (value.comment !== undefined) review.comment = value.comment; // Update comment
    await review.save(); // Validate + write to MongoDB

    await updateMovieRating(review.movie); // Rating may have changed -> refresh average
    await review.populate('user', 'username'); // Include the author's name

    res.status(200).json({ review }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * DELETE /api/reviews/:id  (author or admin)
 * 200 -> { message, id }   403 -> not allowed   404 -> not found
 */
export async function deleteReview(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = getAuthUser(req); // Current user
    const review = await Review.findById(req.params.id); // Load the review
    if (!review) throw new HttpError(404, 'Review not found'); // No such review

    const isAuthor = review.user.toString() === user.id; // Did I write it?
    const isAdmin = user.role === 'admin'; // Am I a moderator?
    if (!isAuthor && !isAdmin) throw new HttpError(403, 'You can only delete your own reviews'); // Neither -> 403

    await review.deleteOne(); // Remove it
    await updateMovieRating(review.movie); // Refresh the movie's average and count

    res.status(200).json({ message: 'Review deleted successfully', id: review._id }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}
