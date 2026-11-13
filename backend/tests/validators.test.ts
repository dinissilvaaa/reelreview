// ============================================================================
// tests/validators.test.ts
// UNIT tests: pure functions, no database or HTTP involved.
// ============================================================================

import { describe, expect, it } from 'vitest'; // Test API
import {
  normalizeMovieInput, // Converts raw bodies into typed data
  validateLoginInput, // Login body rules
  validateMovieInput, // Movie rules
  validateRegisterInput, // Register body rules
  validateReviewInput, // Review rules
} from '../src/utils/validators';
import { escapeRegex, parsePositiveInt } from '../src/utils/query'; // Query helpers

describe('validateRegisterInput', () => {
  it('accepts a valid registration', () => {
    const errors = validateRegisterInput({ username: 'john_doe', email: 'john@example.com', password: 'secret123' }); // Good data
    expect(errors).toEqual([]); // No errors
  });

  it('rejects a bad email, short username and weak password', () => {
    const errors = validateRegisterInput({ username: 'jo', email: 'not-an-email', password: 'short' }); // Three problems
    expect(errors).toHaveLength(3); // One message per problem
  });

  it('rejects non-string values (NoSQL injection attempt)', () => {
    const errors = validateRegisterInput({ username: 'john', email: { $gt: '' }, password: 'secret123' }); // Object instead of string
    expect(errors).toContain('A valid email address is required'); // Blocked
  });
});

describe('validateLoginInput', () => {
  it('requires email and password', () => {
    expect(validateLoginInput({})).toEqual(['Email is required', 'Password is required']); // Both missing
  });
});

describe('normalizeMovieInput + validateMovieInput', () => {
  it('converts multipart form strings into proper types', () => {
    const input = normalizeMovieInput({ title: ' Up ', releaseYear: '2009', durationMinutes: '96', genres: 'Animation, Family' }); // Strings from a form
    expect(input).toEqual({ title: 'Up', releaseYear: 2009, durationMinutes: 96, genres: ['Animation', 'Family'] }); // Typed values
  });

  it('accepts genres sent as a JSON array string', () => {
    expect(normalizeMovieInput({ genres: '["Drama","War"]' }).genres).toEqual(['Drama', 'War']); // Parsed JSON
  });

  it('reports every missing required field when creating', () => {
    const errors = validateMovieInput({}); // Empty movie
    expect(errors).toEqual(
      expect.arrayContaining(['Title is required', 'Description is required', 'Director is required', 'Choose between 1 and 5 genres']),
    ); // All required fields reported
  });

  it('only checks the fields that are sent when updating (partial)', () => {
    expect(validateMovieInput({ title: 'New title' }, { partial: true })).toEqual([]); // Other fields not required
  });

  it('rejects unknown genres and impossible years', () => {
    const errors = validateMovieInput(
      normalizeMovieInput({ title: 'X', description: 'Long enough text', director: 'Y', releaseYear: 1700, genres: ['Drama', 'Cooking'] }),
    ); // Bad year + bad genre
    expect(errors.some((error) => error.startsWith('Release year'))).toBe(true); // Year rejected
    expect(errors).toContain('Invalid genre(s): Cooking'); // Genre rejected by name
  });

  it('only accepts http(s) poster URLs', () => {
    const base = { title: 'X', description: 'Long enough text', director: 'Y', releaseYear: 2000, genres: ['Drama'] }; // Valid movie
    expect(validateMovieInput({ ...base, posterUrl: 'javascript:alert(1)' })).toContain('Poster URL must start with http:// or https://'); // Dangerous URL
    expect(validateMovieInput({ ...base, posterUrl: 'https://example.com/poster.jpg' })).toEqual([]); // Normal URL
  });
});

describe('validateReviewInput', () => {
  it('accepts a rating with a comment', () => {
    expect(validateReviewInput({ rating: 4, comment: '  Great!  ' })).toEqual({ errors: [], value: { rating: 4, comment: 'Great!' } }); // Trimmed
  });

  it.each([0, 6, 3.5, 'abc', null])('rejects the invalid rating %s', (rating) => {
    expect(validateReviewInput({ rating }).errors).toContain('Rating must be a whole number between 1 and 5'); // Each bad value fails
  });

  it('rejects comments longer than 1000 characters', () => {
    expect(validateReviewInput({ rating: 3, comment: 'a'.repeat(1001) }).errors).toContain('Comment must have at most 1000 characters'); // Too long
  });
});

describe('query helpers', () => {
  it('escapes regular-expression characters', () => {
    expect(escapeRegex('a.b*(c)')).toBe('a\\.b\\*\\(c\\)'); // Special characters escaped
  });

  it('parses positive integers with a fallback and a maximum', () => {
    expect(parsePositiveInt('3', 1, 50)).toBe(3); // Normal value
    expect(parsePositiveInt('-2', 1, 50)).toBe(1); // Negative -> fallback
    expect(parsePositiveInt('999', 1, 50)).toBe(50); // Too big -> max
    expect(parsePositiveInt(undefined, 12, 50)).toBe(12); // Missing -> fallback
  });
});
