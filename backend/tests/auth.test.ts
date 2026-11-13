// ============================================================================
// tests/auth.test.ts
// INTEGRATION tests for /api/auth: real Express app + in-memory MongoDB.
// Supertest sends HTTP requests to the app without opening a port.
// ============================================================================

import request from 'supertest'; // HTTP assertions
import { describe, expect, it } from 'vitest'; // Test API
import app from '../src/app'; // The Express application
import { createUserWithToken, useTestDatabase } from './helpers'; // Shared helpers

useTestDatabase(); // Start/clean/stop the in-memory MongoDB for this file

const validUser = { username: 'moviefan', email: 'fan@example.com', password: 'Password123' }; // Reused body

describe('POST /api/auth/register', () => {
  it('creates an account and returns a token (201)', async () => {
    const res = await request(app).post('/api/auth/register').send(validUser); // Register
    expect(res.status).toBe(201); // Created
    expect(res.body.token).toEqual(expect.any(String)); // JWT returned
    expect(res.body.user).toMatchObject({ username: 'moviefan', email: 'fan@example.com', role: 'user' }); // Public user data
    expect(res.body.user.password).toBeUndefined(); // The hash is never exposed
  });

  it('rejects a duplicate email (409)', async () => {
    await request(app).post('/api/auth/register').send(validUser); // First time OK
    const res = await request(app).post('/api/auth/register').send({ ...validUser, username: 'other' }); // Same email
    expect(res.status).toBe(409); // Conflict
  });

  it('rejects invalid input with a list of errors (400)', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'a', email: 'bad', password: '1' }); // All invalid
    expect(res.status).toBe(400); // Bad Request
    expect(res.body.errors.length).toBeGreaterThan(0); // Messages explain why
  });

  it('rejects malformed JSON (400)', async () => {
    const res = await request(app).post('/api/auth/register').set('Content-Type', 'application/json').send('{"oops":'); // Broken JSON
    expect(res.status).toBe(400); // Bad Request
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with the right password (200)', async () => {
    await request(app).post('/api/auth/register').send(validUser); // Create the account
    const res = await request(app).post('/api/auth/login').send({ email: 'FAN@example.com', password: 'Password123' }); // Email is case-insensitive
    expect(res.status).toBe(200); // OK
    expect(res.body.token).toEqual(expect.any(String)); // JWT returned
  });

  it('rejects a wrong password (401)', async () => {
    await request(app).post('/api/auth/register').send(validUser); // Create the account
    const res = await request(app).post('/api/auth/login').send({ email: validUser.email, password: 'WrongPass1' }); // Wrong password
    expect(res.status).toBe(401); // Unauthorized
    expect(res.body.message).toBe('Invalid email or password'); // Generic message
  });
});

describe('GET /api/auth/me', () => {
  it('requires a token (401)', async () => {
    const res = await request(app).get('/api/auth/me'); // No Authorization header
    expect(res.status).toBe(401); // Unauthorized
  });

  it('rejects a fake token (401)', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not.a.real.token'); // Garbage token
    expect(res.status).toBe(401); // Unauthorized
  });

  it('returns the current user (200)', async () => {
    const { authHeader, user } = await createUserWithToken(); // Logged-in user
    const res = await request(app).get('/api/auth/me').set('Authorization', authHeader); // Valid token
    expect(res.status).toBe(200); // OK
    expect(res.body.user.id).toBe(user._id.toString()); // Same user
  });
});
