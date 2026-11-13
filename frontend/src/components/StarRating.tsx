// ============================================================================
// components/StarRating.tsx
// Two modes:
//  - read-only (no onChange): shows a rating such as 4.3 as stars
//  - interactive (onChange given): lets the user pick 1-5 stars with the
//    mouse (hover preview + click) or the keyboard (Tab + Enter/Space)
// ============================================================================

import { useState } from 'react'; // State hook

interface StarRatingProps {
  value: number; // Current rating (0-5, decimals allowed in read-only mode)
  onChange?: (value: number) => void; // When present the component becomes interactive
  size?: 'sm' | 'md' | 'lg'; // Visual size
}

// Font size classes for each size option
const SIZES = { sm: 'text-sm', md: 'text-xl', lg: 'text-3xl' } as const;
const STARS = [1, 2, 3, 4, 5]; // The five stars

export function StarRating({ value, onChange, size = 'md' }: StarRatingProps) {
  const [hovered, setHovered] = useState(0); // Star under the mouse (0 = none)

  // ---- Read-only mode ----
  if (!onChange) {
    const rounded = Math.round(value); // 4.3 -> 4 filled stars
    return (
      <span role="img" aria-label={`Rated ${value} out of 5`} className={`inline-flex ${SIZES[size]}`}>
        {STARS.map((star) => (
          // Filled (amber) or empty (grey) star
          <span key={star} aria-hidden="true" className={star <= rounded ? 'text-amber-400' : 'text-slate-600'}>
            ★
          </span>
        ))}
      </span>
    );
  }

  // ---- Interactive mode ----
  const display = hovered || value; // Preview the hovered value, otherwise the selected one
  return (
    // radiogroup = a set of mutually exclusive options (accessibility)
    <div role="radiogroup" aria-label="Rating" className={`inline-flex ${SIZES[size]}`} onMouseLeave={() => setHovered(0)}>
      {STARS.map((star) => (
        <button
          key={star} // React needs a unique key per list item
          type="button" // Not a submit button (would submit the form)
          role="radio" // Each star is one option
          aria-checked={value === star} // Is this the selected option?
          aria-label={`${star} star${star > 1 ? 's' : ''}`} // "3 stars"
          onClick={() => onChange(star)} // Select this rating
          onMouseEnter={() => setHovered(star)} // Hover preview
          onFocus={() => setHovered(star)} // Keyboard preview
          onBlur={() => setHovered(0)} // Stop previewing
          className={`px-0.5 transition-transform hover:scale-125 focus-visible:scale-125 focus-visible:outline-none ${
            star <= display ? 'text-amber-400' : 'text-slate-600' // Filled or empty
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
