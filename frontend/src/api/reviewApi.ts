// ============================================================================
// api/reviewApi.ts
// Calls to the review endpoints.
// ============================================================================

import { api } from './client'; // Configured Axios instance
import type { MyReview, Review, ReviewInput } from '../types'; // Data types

/** GET /api/movies/:movieId/reviews (public) */
export async function fetchMovieReviews(movieId: string): Promise<Review[]> {
  const { data } = await api.get<{ reviews: Review[] }>(`/movies/${movieId}/reviews`); // Reviews of one movie
  return data.reviews; // Unwrap
}

/** POST /api/movies/:movieId/reviews (logged in) */
export async function createReview(movieId: string, input: ReviewInput): Promise<Review> {
  const { data } = await api.post<{ review: Review }>(`/movies/${movieId}/reviews`, input); // JSON body
  return data.review; // Created review
}

/** PUT /api/reviews/:id (author) */
export async function updateReview(reviewId: string, input: ReviewInput): Promise<Review> {
  const { data } = await api.put<{ review: Review }>(`/reviews/${reviewId}`, input); // JSON body
  return data.review; // Updated review
}

/** DELETE /api/reviews/:id (author or admin) */
export async function deleteReview(reviewId: string): Promise<void> {
  await api.delete(`/reviews/${reviewId}`); // Nothing to return
}

/** GET /api/reviews/me (logged in) */
export async function fetchMyReviews(): Promise<MyReview[]> {
  const { data } = await api.get<{ reviews: MyReview[] }>('/reviews/me'); // My reviews
  return data.reviews; // Unwrap
}
