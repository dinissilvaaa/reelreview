// ============================================================================
// middleware/rateLimiter.ts
// Limits how many login/register attempts one IP can make, which slows
// down brute-force password guessing (basic security requirement).
// ============================================================================

import { rateLimit } from 'express-rate-limit'; // Rate limiting middleware
import { env } from '../config/env'; // Used to disable the limit during tests

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Time window: 15 minutes
  limit: 20, // Max 20 requests per IP inside the window
  standardHeaders: 'draft-8', // Send the standard RateLimit-* response headers
  legacyHeaders: false, // Do not send the old X-RateLimit-* headers
  message: { message: 'Too many attempts. Please try again in 15 minutes.' }, // JSON body of the 429 response
  skip: () => env.isTest, // Automated tests make many requests, so skip the limit there
});
