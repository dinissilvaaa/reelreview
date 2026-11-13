// ============================================================================
// constants/genres.ts
// The fixed list of movie genres accepted by the API.
// Keeping it in one place means the model, the validators and the
// GET /api/movies/genres endpoint can never disagree.
// ============================================================================

// `as const` turns the array into a read-only tuple of literal strings
export const GENRES = [
  'Action', // Fights, chases, explosions
  'Adventure', // Journeys and quests
  'Animation', // Animated films
  'Comedy', // Made to make you laugh
  'Crime', // Criminals, detectives, heists
  'Documentary', // Non-fiction
  'Drama', // Serious, character-driven stories
  'Family', // Suitable for all ages
  'Fantasy', // Magic and imaginary worlds
  'Horror', // Made to scare
  'Musical', // Story told through songs
  'Mystery', // Puzzles and whodunits
  'Romance', // Love stories
  'Sci-Fi', // Science fiction
  'Thriller', // Suspense and tension
  'War', // Set during wars
  'Western', // Cowboys and the American frontier
] as const;

// Type that only accepts one of the strings above, e.g. 'Drama'
export type Genre = (typeof GENRES)[number];

/**
 * Type guard: returns true when `value` is one of the allowed genres.
 * After calling it, TypeScript knows that `value` is a `Genre`.
 */
export function isGenre(value: unknown): value is Genre {
  return typeof value === 'string' && (GENRES as readonly string[]).includes(value); // Must be a string AND in the list
}
