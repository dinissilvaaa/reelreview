// ============================================================================
// tests/reviews.test.ts
// INTEGRATION tests for reviews and the automatic average rating.
// ============================================================================

import request from 'supertest'; // HTTP assertions
import { describe, expect, it } from 'vitest'; // Test API
import app from '../src/app'; // The Express application
import { Movie } from '../src/models/Movie'; // To read the cached rating
import { createTestMovie, createUserWithToken, useTestDatabase } from './helpers'; // Shared helpers

useTestDatabase(); // Start/clean/stop the in-memory MongoDB for this file

describe('POST /api/movies/:movieId/reviews', () => {
  it('creates a review and updates the movie average (201)', async () => {
    const movie = await createTestMovie(); // Movie to review
    const alice = await createUserWithToken(); // First reviewer
    const bob = await createUserWithToken(); // Second reviewer

    const res = await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', alice.authHeader).send({ rating: 5, comment: 'Loved it' }); // 5 stars
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', bob.authHeader).send({ rating: 4 }); // 4 stars

    expect(res.status).toBe(201); // Created
    expect(res.body.review.user.username).toBe(alice.user.username); // Author populated
    const updated = await Movie.findById(movie._id); // Reload the movie
    expect(updated?.averageRating).toBe(4.5); // (5 + 4) / 2
    expect(updated?.reviewCount).toBe(2); // Two reviews
  });

  it('allows only one review per user per movie (409)', async () => {
    const movie = await createTestMovie(); // Movie to review
    const { authHeader } = await createUserWithToken(); // Reviewer
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', authHeader).send({ rating: 3 }); // First review
    const res = await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', authHeader).send({ rating: 4 }); // Second review
    expect(res.status).toBe(409); // Conflict
  });

  it('validates the rating (400) and requires login (401)', async () => {
    const movie = await createTestMovie(); // Movie to review
    const { authHeader } = await createUserWithToken(); // Reviewer
    expect((await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', authHeader).send({ rating: 6 })).status).toBe(400); // Too high
    expect((await request(app).post(`/api/movies/${movie._id}/reviews`).send({ rating: 4 })).status).toBe(401); // No token
  });

  it('returns 404 when the movie does not exist', async () => {
    const { authHeader } = await createUserWithToken(); // Reviewer
    const res = await request(app).post('/api/movies/64b7f9f9f9f9f9f9f9f9f9f9/reviews').set('Authorization', authHeader).send({ rating: 4 }); // Missing movie
    expect(res.status).toBe(404); // Not Found
  });
});

describe('GET reviews', () => {
  it('lists the reviews of a movie publicly (200)', async () => {
    const movie = await createTestMovie(); // Movie
    const { authHeader } = await createUserWithToken(); // Reviewer
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', authHeader).send({ rating: 2 }); // One review
    const res = await request(app).get(`/api/movies/${movie._id}/reviews`); // No token needed
    expect(res.status).toBe(200); // OK
    expect(res.body.reviews).toHaveLength(1); // The review
  });

  it('lists only my own reviews on /api/reviews/me (200)', async () => {
    const movie = await createTestMovie(); // Movie
    const me = await createUserWithToken(); // Me
    const other = await createUserWithToken(); // Someone else
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', me.authHeader).send({ rating: 5 }); // My review
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', other.authHeader).send({ rating: 1 }); // Their review
    const res = await request(app).get('/api/reviews/me').set('Authorization', me.authHeader); // My list
    expect(res.body.reviews).toHaveLength(1); // Only mine
    expect(res.body.reviews[0].movie.title).toBe('Test Movie'); // Movie populated
  });
});

describe('PUT and DELETE /api/reviews/:id', () => {
  it('lets the author edit and recalculates the average (200)', async () => {
    const movie = await createTestMovie(); // Movie
    const author = await createUserWithToken(); // Author
    const created = await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', author.authHeader).send({ rating: 2 }); // 2 stars
    const res = await request(app).put(`/api/reviews/${created.body.review._id}`).set('Authorization', author.authHeader).send({ rating: 5, comment: 'Changed my mind' }); // Edit
    expect(res.status).toBe(200); // OK
    expect((await Movie.findById(movie._id))?.averageRating).toBe(5); // Average updated
  });

  it('forbids editing someone else\'s review (403)', async () => {
    const movie = await createTestMovie(); // Movie
    const author = await createUserWithToken(); // Author
    const intruder = await createUserWithToken(); // Another user
    const created = await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', author.authHeader).send({ rating: 2 }); // Review
    const res = await request(app).put(`/api/reviews/${created.body.review._id}`).set('Authorization', intruder.authHeader).send({ rating: 1 }); // Not mine
    expect(res.status).toBe(403); // Forbidden
  });

  it('lets an admin delete any review and resets the rating (200)', async () => {
    const movie = await createTestMovie(); // Movie
    const author = await createUserWithToken(); // Author
    const admin = await createUserWithToken('admin'); // Moderator
    const created = await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', author.authHeader).send({ rating: 1 }); // Review
    const res = await request(app).delete(`/api/reviews/${created.body.review._id}`).set('Authorization', admin.authHeader); // Moderate
    expect(res.status).toBe(200); // OK
    const updated = await Movie.findById(movie._id); // Reload the movie
    expect(updated?.reviewCount).toBe(0); // No reviews left
    expect(updated?.averageRating).toBe(0); // Average reset
  });
});
