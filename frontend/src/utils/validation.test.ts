// ============================================================================
// utils/validation.test.ts - unit tests for the client-side form validation.
// ============================================================================

import { describe, expect, it } from 'vitest'; // Test API
import { hasErrors, validateLogin, validateMovieForm, validateRegister, validateReview } from './validation'; // Functions under test
import type { MovieFormValues } from '../types'; // Type

// A valid movie form, modified per test
const validMovie: MovieFormValues = {
  title: 'Arrival',
  description: 'A linguist tries to talk to aliens.',
  director: 'Denis Villeneuve',
  releaseYear: '2016',
  durationMinutes: '116',
  genres: ['Sci-Fi'],
  posterUrl: '',
  posterFile: null,
};

describe('validateLogin', () => {
  it('requires a valid email and a password', () => {
    expect(validateLogin({ email: 'nope', password: '' })).toEqual({ email: 'Enter a valid email address', password: 'Password is required' }); // Both wrong
    expect(hasErrors(validateLogin({ email: 'a@b.co', password: 'x' }))).toBe(false); // Valid
  });
});

describe('validateRegister', () => {
  it('detects a weak password and a mismatching confirmation', () => {
    const errors = validateRegister({ username: 'john', email: 'john@mail.com', password: 'abc', confirmPassword: 'abcd' }); // Two problems
    expect(errors.password).toBeDefined(); // Weak
    expect(errors.confirmPassword).toBe('Passwords do not match'); // Mismatch
    expect(errors.username).toBeUndefined(); // Username is fine
  });
});

describe('validateReview', () => {
  it('requires a star rating', () => {
    expect(validateReview({ rating: 0, comment: '' }).rating).toBeDefined(); // No stars
    expect(hasErrors(validateReview({ rating: 4, comment: 'Nice' }))).toBe(false); // Valid
  });
});

describe('validateMovieForm', () => {
  it('accepts a valid movie', () => {
    expect(hasErrors(validateMovieForm(validMovie))).toBe(false); // No errors
  });

  it('rejects missing genres, bad year and a non-image file', () => {
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' }); // Not an image
    const errors = validateMovieForm({ ...validMovie, genres: [], releaseYear: '1500', posterFile: file }); // Three problems
    expect(errors.genres).toBeDefined(); // No genre
    expect(errors.releaseYear).toBeDefined(); // Too old
    expect(errors.posterFile).toBe('Use a JPG, PNG, WEBP or GIF image'); // Wrong type
  });

  it('allows an empty duration but rejects a negative one', () => {
    expect(validateMovieForm({ ...validMovie, durationMinutes: '' }).durationMinutes).toBeUndefined(); // Optional
    expect(validateMovieForm({ ...validMovie, durationMinutes: '-5' }).durationMinutes).toBeDefined(); // Invalid
  });
});
