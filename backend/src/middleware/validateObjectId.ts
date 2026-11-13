// ============================================================================
// middleware/validateObjectId.ts
// Rejects requests whose URL id is not a valid MongoDB ObjectId
// (e.g. GET /api/movies/abc) with 400 Bad Request, before any database call.
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import mongoose from 'mongoose'; // Provides isObjectIdOrHexString()

/**
 * Factory: validateObjectId('id') checks req.params.id,
 * validateObjectId('movieId') checks req.params.movieId, etc.
 */
export function validateObjectId(paramName: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const value = req.params[paramName]; // Read the URL parameter
    if (typeof value !== 'string' || !mongoose.isObjectIdOrHexString(value)) {
      res.status(400).json({ message: `Invalid ${paramName}: must be a 24-character hexadecimal id` }); // Bad id
      return; // Stop here
    }
    next(); // Valid id -> continue
  };
}
