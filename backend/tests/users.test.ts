// ============================================================================
// tests/users.test.ts
// INTEGRATION tests for the admin user-management endpoints.
// ============================================================================

import request from 'supertest'; // HTTP assertions
import { describe, expect, it } from 'vitest'; // Test API
import app from '../src/app'; // The Express application
import { Movie } from '../src/models/Movie'; // To check rating recalculation
import { Review } from '../src/models/Review'; // To check cascade deletes
import { createTestMovie, createUserWithToken, useTestDatabase } from './helpers'; // Shared helpers

useTestDatabase(); // Start/clean/stop the in-memory MongoDB for this file

describe('GET /api/users', () => {
  it('is forbidden for normal users (403)', async () => {
    const { authHeader } = await createUserWithToken('user'); // Normal user
    expect((await request(app).get('/api/users').set('Authorization', authHeader)).status).toBe(403); // Forbidden
  });

  it('lists users with their review counts for admins (200)', async () => {
    const admin = await createUserWithToken('admin'); // Admin
    const res = await request(app).get('/api/users').set('Authorization', admin.authHeader); // List
    expect(res.status).toBe(200); // OK
    expect(res.body.users[0]).toMatchObject({ role: 'admin', reviewCount: 0 }); // Admin itself, no reviews
    expect(res.body.users[0].password).toBeUndefined(); // Never expose hashes
  });
});

describe('PATCH /api/users/:id/role', () => {
  it('promotes a user to admin (200)', async () => {
    const admin = await createUserWithToken('admin'); // Admin
    const target = await createUserWithToken('user'); // User to promote
    const res = await request(app).patch(`/api/users/${target.user._id}/role`).set('Authorization', admin.authHeader).send({ role: 'admin' }); // Promote
    expect(res.status).toBe(200); // OK
    expect(res.body.user.role).toBe('admin'); // Promoted
  });

  it('rejects invalid roles and changing your own role (400)', async () => {
    const admin = await createUserWithToken('admin'); // Admin
    const target = await createUserWithToken('user'); // Another user
    expect((await request(app).patch(`/api/users/${target.user._id}/role`).set('Authorization', admin.authHeader).send({ role: 'king' })).status).toBe(400); // Unknown role
    expect((await request(app).patch(`/api/users/${admin.user._id}/role`).set('Authorization', admin.authHeader).send({ role: 'user' })).status).toBe(400); // Self
  });
});

describe('DELETE /api/users/:id', () => {
  it('deletes the user, their reviews and fixes the ratings (200)', async () => {
    const admin = await createUserWithToken('admin'); // Admin
    const target = await createUserWithToken('user'); // User to delete
    const movie = await createTestMovie(); // Movie reviewed by the user
    await request(app).post(`/api/movies/${movie._id}/reviews`).set('Authorization', target.authHeader).send({ rating: 5 }); // Review

    const res = await request(app).delete(`/api/users/${target.user._id}`).set('Authorization', admin.authHeader); // Delete user
    expect(res.status).toBe(200); // OK
    expect(await Review.countDocuments({ user: target.user._id })).toBe(0); // Reviews removed
    expect((await Movie.findById(movie._id))?.reviewCount).toBe(0); // Rating recalculated
  });

  it('does not let an admin delete their own account (400)', async () => {
    const admin = await createUserWithToken('admin'); // Admin
    expect((await request(app).delete(`/api/users/${admin.user._id}`).set('Authorization', admin.authHeader)).status).toBe(400); // Self-delete blocked
  });
});
