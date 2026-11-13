// ============================================================================
// utils/validation.ts
// Client-side form validation. It mirrors the backend rules so users get
// instant feedback; the backend still validates everything again (never
// trust the client).
// ============================================================================

import type { MovieFormValues } from '../types'; // Admin movie form values

export type FieldErrors<T> = Partial<Record<keyof T, string>>; // { fieldName: 'error message' }

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/; // something@something.xx
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]{3,30}$/; // 3-30 letters, digits, "_", "." or "-"
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/; // 8-72 chars, at least 1 letter and 1 digit
export const MAX_COMMENT_LENGTH = 1000; // Same limit as the backend
export const MAX_POSTER_BYTES = 2 * 1024 * 1024; // 2 MB, same limit as the backend
export const ALLOWED_POSTER_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']; // Same types as the backend
const MAX_YEAR = new Date().getFullYear() + 5; // Same upper limit as the backend

/** true when at least one field has an error message */
export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean); // Any non-empty message?
}

// ---- Login -----------------------------------------------------------------
export interface LoginValues {
  email: string; // Email field
  password: string; // Password field
}

export function validateLogin(values: LoginValues): FieldErrors<LoginValues> {
  const errors: FieldErrors<LoginValues> = {}; // Start with no errors
  if (!values.email.trim()) errors.email = 'Email is required'; // Empty email
  else if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Enter a valid email address'; // Bad format
  if (!values.password) errors.password = 'Password is required'; // Empty password
  return errors; // {} = valid
}

// ---- Register --------------------------------------------------------------
export interface RegisterValues {
  username: string; // Username field
  email: string; // Email field
  password: string; // Password field
  confirmPassword: string; // Repeat password field
}

export function validateRegister(values: RegisterValues): FieldErrors<RegisterValues> {
  const errors: FieldErrors<RegisterValues> = {}; // Start with no errors
  if (!USERNAME_REGEX.test(values.username.trim())) {
    errors.username = '3-30 characters: letters, numbers, ".", "_" or "-"'; // Bad username
  }
  if (!EMAIL_REGEX.test(values.email.trim())) errors.email = 'Enter a valid email address'; // Bad email
  if (!PASSWORD_REGEX.test(values.password)) {
    errors.password = 'At least 8 characters, including a letter and a number'; // Weak password
  }
  if (values.confirmPassword !== values.password) errors.confirmPassword = 'Passwords do not match'; // Typo check
  return errors; // {} = valid
}

// ---- Review ----------------------------------------------------------------
export interface ReviewValues {
  rating: number; // 0 = not chosen yet
  comment: string; // Optional text
}

export function validateReview(values: ReviewValues): FieldErrors<ReviewValues> {
  const errors: FieldErrors<ReviewValues> = {}; // Start with no errors
  if (!Number.isInteger(values.rating) || values.rating < 1 || values.rating > 5) {
    errors.rating = 'Please choose a rating from 1 to 5 stars'; // No star selected
  }
  if (values.comment.trim().length > MAX_COMMENT_LENGTH) {
    errors.comment = `Comment must have at most ${MAX_COMMENT_LENGTH} characters`; // Too long
  }
  return errors; // {} = valid
}

// ---- Movie (admin) ---------------------------------------------------------
export function validateMovieForm(values: MovieFormValues): FieldErrors<MovieFormValues> {
  const errors: FieldErrors<MovieFormValues> = {}; // Start with no errors
  const year = Number(values.releaseYear); // "2010" -> 2010
  const duration = Number(values.durationMinutes); // "148" -> 148

  if (!values.title.trim()) errors.title = 'Title is required'; // Empty title
  else if (values.title.trim().length > 150) errors.title = 'At most 150 characters'; // Too long

  if (values.description.trim().length < 10) errors.description = 'Write at least 10 characters'; // Too short
  else if (values.description.trim().length > 2000) errors.description = 'At most 2000 characters'; // Too long

  if (!values.director.trim()) errors.director = 'Director is required'; // Empty director

  if (!values.releaseYear.trim() || !Number.isInteger(year) || year < 1888 || year > MAX_YEAR) {
    errors.releaseYear = `Enter a year between 1888 and ${MAX_YEAR}`; // Bad year
  }

  if (values.durationMinutes.trim() && (!Number.isInteger(duration) || duration < 1 || duration > 600)) {
    errors.durationMinutes = 'Minutes between 1 and 600 (or leave empty)'; // Bad duration (optional field)
  }

  if (values.genres.length < 1 || values.genres.length > 5) errors.genres = 'Choose between 1 and 5 genres'; // Wrong count

  if (values.posterFile) {
    if (!ALLOWED_POSTER_TYPES.includes(values.posterFile.type)) errors.posterFile = 'Use a JPG, PNG, WEBP or GIF image'; // Bad type
    else if (values.posterFile.size > MAX_POSTER_BYTES) errors.posterFile = 'The image must be 2 MB or smaller'; // Too big
  } else if (values.posterUrl.trim() && !/^(https?:\/\/|\/uploads\/)\S+$/.test(values.posterUrl.trim())) {
    errors.posterUrl = 'The URL must start with http:// or https://'; // Bad URL ("/uploads/..." = current uploaded poster)
  }

  return errors; // {} = valid
}
