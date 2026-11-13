// ============================================================================
// utils/format.test.ts - unit tests for the display helpers.
// ============================================================================

import { describe, expect, it } from 'vitest'; // Test API
import { formatDuration, formatRating, pluralize, titleToHue } from './format'; // Functions under test

describe('formatDuration', () => {
  it.each([
    [148, '2h 28m'], // Hours + minutes
    [120, '2h'], // Whole hours
    [45, '45m'], // Minutes only
    [null, ''], // Unknown
  ])('formats %s minutes as "%s"', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected); // Each row is one check
  });
});

describe('formatRating', () => {
  it('always shows one decimal', () => {
    expect(formatRating(4)).toBe('4.0'); // Integer
    expect(formatRating(3.25)).toBe('3.3'); // Rounded
  });
});

describe('pluralize', () => {
  it('uses the singular only for exactly one', () => {
    expect(pluralize(1, 'review')).toBe('1 review'); // Singular
    expect(pluralize(0, 'review')).toBe('0 reviews'); // Plural
    expect(pluralize(5, 'movie')).toBe('5 movies'); // Plural
  });
});

describe('titleToHue', () => {
  it('returns the same hue for the same title, between 0 and 359', () => {
    const hue = titleToHue('Inception'); // Compute once
    expect(titleToHue('Inception')).toBe(hue); // Stable
    expect(hue).toBeGreaterThanOrEqual(0); // Lower bound
    expect(hue).toBeLessThan(360); // Upper bound
  });
});
