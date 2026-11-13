// ============================================================================
// utils/format.ts
// Small pure functions that turn raw data into display text.
// ============================================================================

/** 148 -> "2h 28m", 45 -> "45m", 120 -> "2h", null -> "" */
export function formatDuration(minutes?: number | null): string {
  if (!minutes || minutes < 1) return ''; // Unknown duration
  const hours = Math.floor(minutes / 60); // Whole hours
  const rest = minutes % 60; // Remaining minutes
  if (hours === 0) return `${rest}m`; // Less than an hour
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`; // Hours (+ minutes)
}

/** "2026-11-13T10:00:00Z" -> "13 Nov 2026" */
export function formatDate(isoDate: string): string {
  const date = new Date(isoDate); // Parse the ISO string
  if (Number.isNaN(date.getTime())) return ''; // Invalid date -> nothing
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); // Day Month Year
}

/** 4 -> "4.0", 4.25 -> "4.3" */
export function formatRating(value: number): string {
  return value.toFixed(1); // Always one decimal
}

/** (1, 'review') -> "1 review", (3, 'review') -> "3 reviews" */
export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`; // Singular only for exactly 1
}

/**
 * Turns a title into a stable colour hue (0-359), so every movie without a
 * poster always gets the same placeholder colour.
 */
export function titleToHue(title: string): number {
  let hash = 0; // Running hash value
  for (const char of title) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360; // Classic string hash, kept within 0-359
  }
  return hash; // Hue for hsl()
}
