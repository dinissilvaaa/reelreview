// ============================================================================
// middleware/errorHandler.ts
// Centralised error handling. Every controller has a try/catch that calls
// next(error); this file decides which HTTP status + JSON body to send.
//   400 Bad Request     -> invalid input / invalid id / bad upload
//   401 / 403 / 404     -> thrown as HttpError by controllers
//   409 Conflict        -> duplicate unique value (email, username, review)
//   500 Server Error    -> anything unexpected (details hidden in production)
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import mongoose from 'mongoose'; // Gives access to Mongoose error classes
import multer from 'multer'; // Gives access to MulterError
import { HttpError } from '../utils/HttpError'; // Our own error class
import { env } from '../config/env'; // Used to hide error details in production

/**
 * Catches requests that did not match any route -> 404 Not Found.
 * Registered after all the routes in app.ts.
 */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); // e.g. "GET /api/nope"
}

// MongoDB duplicate key errors have code 11000 and say which field clashed
function isDuplicateKeyError(err: unknown): err is { code: number; keyValue?: Record<string, unknown> } {
  return typeof err === 'object' && err !== null && (err as { code?: unknown }).code === 11000; // Mongo's duplicate code
}

// Errors created by body-parser (express.json) carry a 4xx `status` and `expose: true`
function isClientHttpError(err: unknown): err is { status: number; message: string } {
  const candidate = err as { status?: unknown; expose?: unknown }; // Look at the properties safely
  return typeof candidate?.status === 'number' && candidate.status >= 400 && candidate.status < 500 && candidate.expose === true; // 4xx only
}

/**
 * Express recognises error handlers by their 4 parameters (err, req, res, next),
 * so `_next` must stay in the signature even though it is not used.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  // 1) Errors we threw on purpose
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ message: err.message, ...(err.details && { errors: err.details }) }); // Status chosen by the controller
    return; // Done
  }

  // 2) Mongoose schema validation failed (e.g. rating = 10)
  if (err instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(err.errors).map((error) => error.message); // Collect every field message
    res.status(400).json({ message: 'Validation failed', errors }); // 400 Bad Request
    return; // Done
  }

  // 3) A value could not be converted to the schema type (e.g. a bad ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({ message: `Invalid value for "${err.path}"` }); // 400 Bad Request
    return; // Done
  }

  // 4) Unique index violation (email/username taken, second review of the same movie)
  if (isDuplicateKeyError(err)) {
    const field = Object.keys(err.keyValue ?? {}).join(', ') || 'value'; // Which field(s) clashed
    res.status(409).json({ message: `Duplicate ${field}: this ${field} already exists` }); // 409 Conflict
    return; // Done
  }

  // 5) Upload problems (file too big, too many files...)
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE' ? 'Poster image must be 2 MB or smaller' : `Upload error: ${err.message}`; // Friendly text
    res.status(400).json({ message }); // 400 Bad Request
    return; // Done
  }

  // 6) Malformed JSON body or body too large
  if (isClientHttpError(err)) {
    const message = err.status === 400 ? 'Malformed JSON in request body' : err.message; // Friendly text for broken JSON
    res.status(err.status).json({ message }); // 400 / 413
    return; // Done
  }

  // 7) Anything else is a bug or an infrastructure problem -> 500
  if (!env.isTest) console.error('❌ Unexpected error:', err); // Log the full error on the server (quiet during tests)
  res.status(500).json({
    message: 'Internal server error', // Generic message for the client
    ...(!env.isProduction && err instanceof Error && { detail: err.message }), // Extra detail only outside production
  });
}
