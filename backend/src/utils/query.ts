// ============================================================================
// utils/query.ts
// Small helpers to read query-string values (?search=...&page=2) safely.
// ============================================================================

/**
 * Returns the value only if it is a plain string, otherwise undefined.
 * Query values can also be arrays (?genre=a&genre=b), which we reject here.
 */
export function queryString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined; // Ignore anything that is not a single string
}

/**
 * Parses a positive integer from the query string, clamped between 1 and `max`.
 * Invalid or missing values fall back to `fallback`.
 */
export function parsePositiveInt(value: unknown, fallback: number, max: number): number {
  const parsed = Number.parseInt(queryString(value) ?? '', 10); // Convert "3" -> 3 (NaN when invalid)
  if (Number.isNaN(parsed) || parsed < 1) return fallback; // Invalid or too small -> use the default
  return Math.min(parsed, max); // Never allow more than `max` (protects the database)
}

/**
 * Escapes characters that have a special meaning in regular expressions.
 * Without this, a search for "(" would crash and a search for ".*" would match everything.
 */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Put a backslash before each special character
}
