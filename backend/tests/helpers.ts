// ============================================================================
// tests/helpers.ts
// Shared utilities for the integration tests.
// Each test file starts its own temporary in-memory MongoDB, so the tests
// never touch your real database and need no MongoDB installation.
// ============================================================================

import mongoose from 'mongoose'; // Database connection
import { MongoMemoryServer } from 'mongodb-memory-server-core'; // Temporary MongoDB that lives in RAM
import { afterAll, afterEach, beforeAll } from 'vitest'; // Test lifecycle hooks
import { User } from '../src/models/User'; // User model
import { Movie } from '../src/models/Movie'; // Movie model
import { generateToken } from '../src/utils/token'; // Creates JWTs
import type { UserRole } from '../src/constants/roles'; // 'user' | 'admin'

let mongoServer: MongoMemoryServer | undefined; // The in-memory server for the current test file

/**
 * Call once at the top of a test file:
 *  - before all tests: start MongoDB in memory and connect
 *  - after each test:  empty every collection (tests stay independent)
 *  - after all tests:  disconnect and stop the server
 */
export function useTestDatabase(): void {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create(); // First run downloads a MongoDB binary (cached afterwards)
    await mongoose.connect(mongoServer.getUri()); // Connect Mongoose to it
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes())); // Build unique indexes now
  });

  afterEach(async () => {
    const collections = Object.values(mongoose.connection.collections); // Every collection used so far
    await Promise.all(collections.map((collection) => collection.deleteMany({}))); // Remove all documents
  });

  afterAll(async () => {
    await mongoose.disconnect(); // Close the connection
    await mongoServer?.stop(); // Shut down the in-memory server
  });
}

let userCounter = 0; // Makes every generated username/email unique

/**
 * Creates a user directly in the database and returns it with a valid token.
 */
export async function createUserWithToken(role: UserRole = 'user') {
  userCounter += 1; // Next number
  const user = await User.create({
    username: `tester${userCounter}`, // e.g. tester1
    email: `tester${userCounter}@example.com`, // e.g. tester1@example.com
    password: 'Password123', // Valid password (hashed by the model)
    role, // 'user' or 'admin'
  });
  const token = generateToken({ id: user._id.toString() }); // Same kind of token the login endpoint returns
  return { user, token, authHeader: `Bearer ${token}` }; // authHeader is ready for .set('Authorization', ...)
}

/**
 * Creates a valid movie directly in the database (overrides change any field).
 */
export async function createTestMovie(overrides: Record<string, unknown> = {}) {
  return Movie.create({
    title: 'Test Movie', // Default title
    description: 'A movie created by the automated tests.', // Default description (>= 10 chars)
    director: 'Test Director', // Default director
    releaseYear: 2020, // Default year
    durationMinutes: 100, // Default runtime
    genres: ['Drama'], // Default genre
    ...overrides, // Custom values for a specific test
  });
}
