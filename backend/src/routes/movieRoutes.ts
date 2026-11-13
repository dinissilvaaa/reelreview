// ============================================================================
// routes/movieRoutes.ts
// Mounted at /api/movies in app.ts.
// Middleware order matters: protect -> adminOnly -> validateObjectId -> upload -> controller
// ============================================================================

import { Router } from 'express'; // Express router
import {
  createMovie, // POST   /
  deleteMovie, // DELETE /:id
  getGenres, // GET    /genres
  getMovieById, // GET    /:id
  getMovies, // GET    /
  updateMovie, // PUT    /:id
} from '../controllers/movieController';
import { createReview, getMovieReviews } from '../controllers/reviewController'; // Nested review routes
import { adminOnly, protect } from '../middleware/auth'; // Auth guards
import { uploadPoster } from '../middleware/upload'; // Multer: reads the "poster" file
import { validateObjectId } from '../middleware/validateObjectId'; // 400 for malformed ids

const router = Router(); // New router instance

// ---- Public routes ---------------------------------------------------------
router.get('/', getMovies); // List/search/filter movies
router.get('/genres', getGenres); // List of genres (declared BEFORE "/:id" so "genres" is not treated as an id)
router.get('/:id', validateObjectId('id'), getMovieById); // One movie

// ---- Reviews of a movie (nested resource) ----------------------------------
router.get('/:movieId/reviews', validateObjectId('movieId'), getMovieReviews); // Public: read reviews
router.post('/:movieId/reviews', protect, validateObjectId('movieId'), createReview); // Logged in: write a review

// ---- Admin-only routes -----------------------------------------------------
router.post('/', protect, adminOnly, uploadPoster, createMovie); // Create a movie (+ optional poster upload)
router.put('/:id', protect, adminOnly, validateObjectId('id'), uploadPoster, updateMovie); // Update a movie
router.delete('/:id', protect, adminOnly, validateObjectId('id'), deleteMovie); // Delete a movie

export default router; // Exported so app.ts can mount it
