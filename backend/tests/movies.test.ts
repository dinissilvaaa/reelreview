// ============================================================================
// tests/movies.test.ts
// INTEGRATION tests for /api/movies (CRUD, search, filter, permissions).
// ============================================================================

import request from 'supertest'; // HTTP assertions
import { describe, expect, it } from 'vitest'; // Test API
import app from '../src/app'; // The Express application
import { Review } from '../src/models/Review'; // To check cascade deletes
import { createTestMovie, createUserWithToken, useTestDatabase } from './helpers'; // Shared helpers

useTestDatabase(); // Start/clean/stop the in-memory MongoDB for this file

const newMovie = {
  title: 'Arrival', // Title
  description: 'A linguist works with the military to communicate with alien visitors.', // Description
  director: 'Denis Villeneuve', // Director
  releaseYear: 2016, // Year
  durationMinutes: 116, // Runtime
  genres: ['Sci-Fi', 'Drama'], // Genres
}; // Valid body for POST /api/movies

describe('GET /api/movies (browse, search, filter)', () => {
  it('returns a paginated list (200)', async () => {
    await Promise.all([createTestMovie({ title: 'A' }), createTestMovie({ title: 'B' }), createTestMovie({ title: 'C' })]); // 3 movies
    const res = await request(app).get('/api/movies?limit=2&page=1&sort=title'); // First page of 2
    expect(res.status).toBe(200); // OK
    expect(res.body.movies.map((movie: { title: string }) => movie.title)).toEqual(['A', 'B']); // Sorted A-Z
    expect(res.body).toMatchObject({ page: 1, limit: 2, total: 3, totalPages: 2 }); // Pagination info
  });

  it('filters by genre', async () => {
    await createTestMovie({ title: 'Funny', genres: ['Comedy'] }); // Comedy
    await createTestMovie({ title: 'Scary', genres: ['Horror'] }); // Horror
    const res = await request(app).get('/api/movies?genre=Horror'); // Only horror
    expect(res.body.movies).toHaveLength(1); // One match
    expect(res.body.movies[0].title).toBe('Scary'); // The horror movie
  });

  it('searches title and director case-insensitively', async () => {
    await createTestMovie({ title: 'Inception', director: 'Christopher Nolan' }); // Match
    await createTestMovie({ title: 'Up', director: 'Pete Docter' }); // No match
    const byTitle = await request(app).get('/api/movies?search=incep'); // Partial, lowercase title
    const byDirector = await request(app).get('/api/movies?search=NOLAN'); // Uppercase director
    expect(byTitle.body.total).toBe(1); // Found by title
    expect(byDirector.body.total).toBe(1); // Found by director
  });

  it('treats special characters in the search as plain text', async () => {
    await createTestMovie({ title: 'Normal' }); // Should NOT match ".*"
    const res = await request(app).get('/api/movies?search=.*'); // Regex-like input
    expect(res.status).toBe(200); // No crash
    expect(res.body.total).toBe(0); // No match
  });

  it('rejects an unknown genre or sort (400)', async () => {
    expect((await request(app).get('/api/movies?genre=Cooking')).status).toBe(400); // Bad genre
    expect((await request(app).get('/api/movies?sort=random')).status).toBe(400); // Bad sort
  });

  it('lists the available genres (200)', async () => {
    const res = await request(app).get('/api/movies/genres'); // Genre list
    expect(res.status).toBe(200); // OK
    expect(res.body.genres).toContain('Sci-Fi'); // Contains known genres
  });
});

describe('GET /api/movies/:id', () => {
  it('returns one movie (200)', async () => {
    const movie = await createTestMovie(); // Existing movie
    const res = await request(app).get(`/api/movies/${movie._id}`); // Fetch it
    expect(res.status).toBe(200); // OK
    expect(res.body.movie.title).toBe('Test Movie'); // Right movie
  });

  it('returns 400 for a malformed id and 404 for a missing movie', async () => {
    expect((await request(app).get('/api/movies/abc')).status).toBe(400); // Not an ObjectId
    expect((await request(app).get('/api/movies/64b7f9f9f9f9f9f9f9f9f9f9')).status).toBe(404); // Valid id, no movie
  });
});

describe('POST /api/movies (admin only)', () => {
  it('lets an admin create a movie (201)', async () => {
    const { authHeader } = await createUserWithToken('admin'); // Admin
    const res = await request(app).post('/api/movies').set('Authorization', authHeader).send(newMovie); // Create
    expect(res.status).toBe(201); // Created
    expect(res.body.movie).toMatchObject({ title: 'Arrival', averageRating: 0, reviewCount: 0 }); // Defaults applied
  });

  it('accepts multipart/form-data like the admin panel sends', async () => {
    const { authHeader } = await createUserWithToken('admin'); // Admin
    const res = await request(app)
      .post('/api/movies')
      .set('Authorization', authHeader)
      .field('title', 'Arrival') // Every field is a string in a form
      .field('description', newMovie.description)
      .field('director', newMovie.director)
      .field('releaseYear', '2016')
      .field('genres', 'Sci-Fi,Drama'); // Comma separated genres
    expect(res.status).toBe(201); // Created
    expect(res.body.movie.genres).toEqual(['Sci-Fi', 'Drama']); // Parsed into an array
  });

  it('rejects normal users (403) and anonymous users (401)', async () => {
    const { authHeader } = await createUserWithToken('user'); // Normal user
    expect((await request(app).post('/api/movies').set('Authorization', authHeader).send(newMovie)).status).toBe(403); // Forbidden
    expect((await request(app).post('/api/movies').send(newMovie)).status).toBe(401); // Unauthorized
  });

  it('rejects invalid data (400)', async () => {
    const { authHeader } = await createUserWithToken('admin'); // Admin
    const res = await request(app).post('/api/movies').set('Authorization', authHeader).send({ title: '' }); // Almost empty
    expect(res.status).toBe(400); // Bad Request
    expect(res.body.errors).toContain('Title is required'); // Explains why
  });
});

describe('PUT /api/movies/:id and DELETE /api/movies/:id (admin only)', () => {
  it('updates only the fields that are sent (200)', async () => {
    const { authHeader } = await createUserWithToken('admin'); // Admin
    const movie = await createTestMovie(); // Existing movie
    const res = await request(app).put(`/api/movies/${movie._id}`).set('Authorization', authHeader).send({ title: 'Renamed' }); // Rename
    expect(res.status).toBe(200); // OK
    expect(res.body.movie).toMatchObject({ title: 'Renamed', director: 'Test Director' }); // Other fields unchanged
  });

  it('deletes a movie together with its reviews (200)', async () => {
    const { authHeader } = await createUserWithToken('admin'); // Admin
    const { user } = await createUserWithToken('user'); // Review author
    const movie = await createTestMovie(); // Existing movie
    await Review.create({ movie: movie._id, user: user._id, rating: 5 }); // One review

    const res = await request(app).delete(`/api/movies/${movie._id}`).set('Authorization', authHeader); // Delete
    expect(res.status).toBe(200); // OK
    expect((await request(app).get(`/api/movies/${movie._id}`)).status).toBe(404); // Movie gone
    expect(await Review.countDocuments({ movie: movie._id })).toBe(0); // Reviews gone too
  });
});

describe('Unknown routes', () => {
  it('returns 404 JSON for an unknown endpoint', async () => {
    const res = await request(app).get('/api/does-not-exist'); // No such route
    expect(res.status).toBe(404); // Not Found
    expect(res.body.message).toContain('Route not found'); // JSON message
  });
});
