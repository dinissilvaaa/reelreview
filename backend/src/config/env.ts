// ============================================================================
// config/env.ts
// Central, typed access to environment variables.
// Every other file imports `env` from here instead of reading `process.env`
// directly, so all configuration lives in ONE place and is checked at startup.
// ============================================================================

import dotenv from 'dotenv'; // Library that reads KEY=value pairs from a .env file

dotenv.config({ quiet: true }); // Copy the .env values into process.env (quiet = no console banner)

const nodeEnv = process.env.NODE_ENV ?? 'development'; // Current mode: development | production | test
const isProduction = nodeEnv === 'production'; // Shortcut flag: are we running in production?

// Fallback secret used ONLY in development/tests so the app runs without extra setup
const DEV_JWT_SECRET = 'dev-only-insecure-secret-change-me';

// Basic security rule: never start a production server with the insecure fallback secret
if (isProduction && !process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable must be defined in production'); // Fail fast with a clear message
}

// The exported object: one typed property per setting
export const env = {
  nodeEnv, // development | production | test
  isProduction, // true only in production
  isTest: nodeEnv === 'test', // true while the automated tests run (Vitest sets NODE_ENV=test)
  port: Number(process.env.PORT) || 5000, // HTTP port (falls back to 5000 when missing/invalid)
  mongoUri: process.env.MONGO_URI ?? 'mongodb://127.0.0.1:27017/reelreview', // MongoDB connection string
  jwtSecret: process.env.JWT_SECRET ?? DEV_JWT_SECRET, // Secret used to sign/verify JWT tokens
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d', // Token lifetime (e.g. "1h", "7d")
  clientUrls: (process.env.CLIENT_URL ?? 'http://localhost:5173') // Allowed frontend origins for CORS...
    .split(',') // ...support several URLs separated by commas...
    .map((url) => url.trim()) // ...remove accidental spaces around each URL...
    .filter(Boolean), // ...and drop empty entries
  trustProxy: process.env.TRUST_PROXY === 'true', // Trust X-Forwarded-* headers from a reverse proxy (nginx)
  seedOnStart: process.env.SEED_ON_START === 'true', // Fill an empty database with demo data on startup
  adminEmail: process.env.ADMIN_EMAIL ?? 'admin@reelreview.com', // Email of the seeded admin account
  adminPassword: process.env.ADMIN_PASSWORD ?? 'Admin123!', // Password of the seeded admin account
} as const; // `as const` makes every property read-only
