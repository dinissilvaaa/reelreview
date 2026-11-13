// ============================================================================
// components/Poster.tsx
// Shows a movie poster image. When there is no image (or it fails to load)
// it renders a coloured placeholder generated from the movie title.
// ============================================================================

import { useState } from 'react'; // State hook
import { resolveAssetUrl } from '../api/client'; // Builds the full URL of uploaded files
import { titleToHue } from '../utils/format'; // Title -> colour

interface PosterProps {
  title: string; // Movie title (used for alt text and the placeholder)
  posterUrl?: string; // '' | 'https://...' | '/uploads/...' | 'blob:...'
  className?: string; // Extra classes from the parent (size, rounding...)
  compact?: boolean; // Tiny thumbnails: show only the first letter in the placeholder
}

export function Poster({ title, posterUrl, className = '', compact = false }: PosterProps) {
  const [failedSrc, setFailedSrc] = useState(''); // Remembers which URL failed to load
  const src = resolveAssetUrl(posterUrl); // Full image URL ('' when there is none)
  const showImage = src !== '' && src !== failedSrc; // Show the <img> unless it is missing or already failed

  if (showImage) {
    return (
      <img
        src={src} // Image address
        alt={`Poster of ${title}`} // Accessible description
        loading="lazy" // Only download when it scrolls into view (faster pages)
        onError={() => setFailedSrc(src)} // Broken image -> switch to the placeholder
        className={`aspect-[2/3] w-full object-cover ${className}`} // Classic 2:3 poster ratio
      />
    );
  }

  const hue = titleToHue(title); // Same title -> same colour every time
  return (
    <div
      role="img" // Behaves like an image for screen readers
      aria-label={`Placeholder poster for ${title}`} // Accessible description
      className={`flex aspect-[2/3] w-full flex-col items-center justify-center gap-3 p-4 text-center ${className}`} // Same size as a real poster
      style={{ background: `linear-gradient(160deg, hsl(${hue} 65% 38%), hsl(${(hue + 50) % 360} 55% 14%))` }} // Dynamic gradient (inline style)
    >
      {compact ? (
        // Thumbnail: just the first letter (a full title would not fit)
        <span className="text-lg font-extrabold text-white/90" aria-hidden="true">
          {title.charAt(0).toUpperCase()}
        </span>
      ) : (
        <>
          {/* Decorative icon */}
          <span className="text-4xl" aria-hidden="true">
            🎬
          </span>
          {/* Title text, clamped to 3 lines */}
          <span className="line-clamp-3 text-sm font-bold text-white/90 drop-shadow">{title}</span>
        </>
      )}
    </div>
  );
}
