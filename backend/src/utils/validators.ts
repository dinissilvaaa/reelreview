// ============================================================================
// utils/validators.ts
// Input validation for every request body the API accepts.
// Each function returns a list of human-readable error messages
// (an empty list means the input is valid). Controllers answer with
// 400 Bad Request when the list is not empty.
//
// Checking `typeof value === 'string'` everywhere also blocks NoSQL
// injection attempts such as { "email": { "$gt": "" } }.
// ============================================================================

import { isGenre } from '../constants/genres'; // Checks a genre against the allowed list

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // something@something.xx
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/; // 3-30 letters, digits, "_", "." or "-"
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/; // 8-72 chars with at least 1 letter and 1 digit (bcrypt max is 72)
const POSTER_URL_REGEX = /^https?:\/\/\S+$/; // Clients may only send http(s) URLs; "/uploads/..." paths are set by the server
const MAX_YEAR = new Date().getFullYear() + 5; // Same upper limit as the Movie model

// Helper: true for `{ ... }` objects (false for null, arrays, strings, numbers)
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value); // Only real objects pass
}

// Helper: true for non-empty strings (after trimming spaces)
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0; // Must be text with real content
}

// ----------------------------------------------------------------------------
// Authentication
// ----------------------------------------------------------------------------

/** Validates the body of POST /api/auth/register */
export function validateRegisterInput(body: unknown): string[] {
  if (!isPlainObject(body)) return ['Request body must be a JSON object']; // Nothing else can be checked
  const errors: string[] = []; // Collected error messages
  const { username, email, password } = body; // Fields we expect

  if (typeof username !== 'string' || !USERNAME_REGEX.test(username.trim())) {
    errors.push('Username must be 3-30 characters and use only letters, numbers, ".", "_" or "-"'); // Bad username
  }
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    errors.push('A valid email address is required'); // Bad email
  }
  if (typeof password !== 'string' || !PASSWORD_REGEX.test(password)) {
    errors.push('Password must be 8-72 characters long and contain at least one letter and one number'); // Weak password
  }
  return errors; // Empty array = valid
}

/** Validates the body of POST /api/auth/login */
export function validateLoginInput(body: unknown): string[] {
  if (!isPlainObject(body)) return ['Request body must be a JSON object']; // Nothing else can be checked
  const errors: string[] = []; // Collected error messages
  if (!isNonEmptyString(body.email)) errors.push('Email is required'); // Missing email
  if (!isNonEmptyString(body.password)) errors.push('Password is required'); // Missing password
  return errors; // Empty array = valid
}

// ----------------------------------------------------------------------------
// Movies
// ----------------------------------------------------------------------------

// Cleaned-up movie data after normalisation (all fields optional for PATCH-like updates)
export interface MovieInput {
  title?: string; // Movie title
  description?: string; // Synopsis
  director?: string; // Director
  releaseYear?: number; // Year as a number
  durationMinutes?: number | null; // Minutes, or null to clear the value
  genres?: string[]; // List of genre names (validated separately)
  posterUrl?: string; // Poster URL/path ('' removes the poster)
}

// Converts "Action, Drama" | ["Action","Drama"] | '["Action","Drama"]' into a string array
function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()); // Already an array
  if (typeof value !== 'string') return []; // Unsupported type -> empty list (will fail validation)
  const text = value.trim(); // Remove surrounding spaces
  if (text.startsWith('[')) {
    try {
      return toStringArray(JSON.parse(text)); // JSON array sent as text (common with multipart forms)
    } catch {
      return []; // Broken JSON -> empty list (will fail validation)
    }
  }
  return text.split(',').map((item) => item.trim()).filter(Boolean); // Comma separated list
}

// Converts a text value to a trimmed string, or '' when the value is not text
function toTrimmedString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''; // Objects/numbers become '' and fail "required" checks
}

/**
 * Turns a raw request body (JSON or multipart/form-data, where every value
 * is a string) into a typed MovieInput. Only fields present in the body are copied.
 */
export function normalizeMovieInput(body: unknown): MovieInput {
  if (!isPlainObject(body)) return {}; // No body -> nothing to copy
  const input: MovieInput = {}; // Result object

  if ('title' in body) input.title = toTrimmedString(body.title); // Text field
  if ('description' in body) input.description = toTrimmedString(body.description); // Text field
  if ('director' in body) input.director = toTrimmedString(body.director); // Text field
  if ('releaseYear' in body) input.releaseYear = body.releaseYear === '' ? Number.NaN : Number(body.releaseYear); // "2010" -> 2010
  if ('durationMinutes' in body) {
    const raw = body.durationMinutes; // Original value
    input.durationMinutes = raw === '' || raw === null ? null : Number(raw); // Empty -> null (clear), otherwise number
  }
  if ('genres' in body) input.genres = toStringArray(body.genres); // Many formats -> string[]
  if ('posterUrl' in body) input.posterUrl = toTrimmedString(body.posterUrl); // Text field

  return input; // Typed, cleaned data
}

/**
 * Validates a normalised movie.
 * partial = false -> creating a movie, required fields must exist.
 * partial = true  -> updating a movie, only the fields sent are checked.
 */
export function validateMovieInput(input: MovieInput, { partial = false } = {}): string[] {
  const errors: string[] = []; // Collected error messages

  // Title: required, 1-150 characters
  if (input.title !== undefined || !partial) {
    if (!input.title) errors.push('Title is required'); // Missing/empty
    else if (input.title.length > 150) errors.push('Title must have at most 150 characters'); // Too long
  }

  // Description: required, 10-2000 characters
  if (input.description !== undefined || !partial) {
    if (!input.description) errors.push('Description is required'); // Missing/empty
    else if (input.description.length < 10) errors.push('Description must have at least 10 characters'); // Too short
    else if (input.description.length > 2000) errors.push('Description must have at most 2000 characters'); // Too long
  }

  // Director: required, max 100 characters
  if (input.director !== undefined || !partial) {
    if (!input.director) errors.push('Director is required'); // Missing/empty
    else if (input.director.length > 100) errors.push('Director must have at most 100 characters'); // Too long
  }

  // Release year: required whole number between 1888 and current year + 5
  if (input.releaseYear !== undefined || !partial) {
    const year = input.releaseYear; // Value to check
    if (year === undefined || !Number.isInteger(year) || year < 1888 || year > MAX_YEAR) {
      errors.push(`Release year must be a whole number between 1888 and ${MAX_YEAR}`); // Invalid year
    }
  }

  // Duration: optional whole number between 1 and 600
  if (input.durationMinutes !== undefined && input.durationMinutes !== null) {
    const minutes = input.durationMinutes; // Value to check
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 600) {
      errors.push('Duration must be a whole number of minutes between 1 and 600'); // Invalid duration
    }
  }

  // Genres: required, 1-5 items, each must be in the allowed list
  if (input.genres !== undefined || !partial) {
    const genres = input.genres ?? []; // Missing -> empty list
    if (genres.length < 1 || genres.length > 5) errors.push('Choose between 1 and 5 genres'); // Wrong count
    const invalid = genres.filter((genre) => !isGenre(genre)); // Unknown genre names
    if (invalid.length > 0) errors.push(`Invalid genre(s): ${invalid.join(', ')}`); // Report them by name
  }

  // Poster URL: optional, must be http(s) or one of our uploaded files
  if (input.posterUrl) {
    if (!POSTER_URL_REGEX.test(input.posterUrl)) errors.push('Poster URL must start with http:// or https://'); // Bad URL
  }

  return errors; // Empty array = valid
}

// ----------------------------------------------------------------------------
// Reviews
// ----------------------------------------------------------------------------

// Cleaned-up review data
export interface ReviewInput {
  rating?: number; // 1-5
  comment?: string; // Optional text
}

/**
 * Validates and normalises a review body.
 * Returns both the errors and the cleaned value.
 */
export function validateReviewInput(body: unknown, { partial = false } = {}): { errors: string[]; value: ReviewInput } {
  if (!isPlainObject(body)) return { errors: ['Request body must be a JSON object'], value: {} }; // Nothing to check
  const errors: string[] = []; // Collected error messages
  const value: ReviewInput = {}; // Cleaned data

  // Rating: required whole number 1-5 (strings like "4" are accepted and converted)
  if (body.rating !== undefined || !partial) {
    const rating = typeof body.rating === 'string' ? Number(body.rating) : body.rating; // "4" -> 4
    if (typeof rating !== 'number' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      errors.push('Rating must be a whole number between 1 and 5'); // Invalid rating
    } else {
      value.rating = rating; // Valid -> keep it
    }
  }

  // Comment: optional text up to 1000 characters
  if (body.comment !== undefined && body.comment !== null) {
    if (typeof body.comment !== 'string') errors.push('Comment must be text'); // Wrong type
    else if (body.comment.trim().length > 1000) errors.push('Comment must have at most 1000 characters'); // Too long
    else value.comment = body.comment.trim(); // Valid -> keep it (trimmed)
  }

  return { errors, value }; // Caller decides what to do
}
