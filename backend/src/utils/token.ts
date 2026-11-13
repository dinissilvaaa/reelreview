// ============================================================================
// utils/token.ts
// Creates and verifies JSON Web Tokens (JWT) used for authentication.
// After login the client stores the token and sends it in the header:
//   Authorization: Bearer <token>
// ============================================================================

import jwt, { type SignOptions } from 'jsonwebtoken'; // Library that signs and verifies JWTs
import { env } from '../config/env'; // Gives us the secret and the expiry time

// Data stored inside the token (kept minimal: never put passwords here)
export interface TokenPayload {
  id: string; // MongoDB _id of the logged-in user
}

/**
 * Signs a new token for the given user id.
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'], // e.g. "7d" -> token expires after 7 days
  });
}

/**
 * Verifies a token and returns its payload.
 * Throws if the token is invalid, was tampered with, or has expired.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.jwtSecret); // Checks the signature and the expiry date
  if (typeof decoded === 'string' || typeof decoded.id !== 'string') {
    throw new Error('Invalid token payload'); // We only issue object payloads with an `id`
  }
  return { id: decoded.id }; // Return only the fields we trust
}
