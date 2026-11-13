// ============================================================================
// components/MovieCard.tsx
// One movie in the browse grid: poster, title, year, genres and rating.
// The whole card is a link to the movie details page.
// ============================================================================

import { Link } from 'react-router-dom'; // Client-side navigation (no full page reload)
import { Poster } from './Poster'; // Poster image / placeholder
import { StarRating } from './StarRating'; // Stars
import { formatDuration, formatRating } from '../utils/format'; // Display helpers
import type { Movie } from '../types'; // Movie type

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link
      to={`/movies/${movie._id}`} // Details page URL
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-amber-400/60 hover:shadow-xl hover:shadow-amber-400/5 focus-visible:outline-2 focus-visible:outline-amber-400"
    >
      {/* Poster with a subtle zoom on hover */}
      <div className="overflow-hidden">
        <Poster title={movie.title} posterUrl={movie.posterUrl} className="transition duration-300 group-hover:scale-105" />
      </div>

      {/* Text area */}
      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Title (max 2 lines) */}
        <h3 className="line-clamp-2 font-semibold leading-snug text-white group-hover:text-amber-300">{movie.title}</h3>
        {/* Year · duration */}
        <p className="text-xs text-slate-400">
          {movie.releaseYear}
          {movie.durationMinutes ? ` · ${formatDuration(movie.durationMinutes)}` : ''}
        </p>
        {/* Up to two genre badges */}
        <div className="flex flex-wrap gap-1">
          {movie.genres.slice(0, 2).map((genre) => (
            <span key={genre} className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
              {genre}
            </span>
          ))}
        </div>
        {/* Rating pinned to the bottom of the card */}
        <div className="mt-auto flex items-center gap-1.5 pt-1 text-sm">
          {movie.reviewCount > 0 ? (
            <>
              <StarRating value={movie.averageRating} size="sm" /> {/* Stars */}
              <span className="font-semibold text-amber-300">{formatRating(movie.averageRating)}</span> {/* 4.5 */}
              <span className="text-xs text-slate-500">({movie.reviewCount})</span> {/* (12) */}
            </>
          ) : (
            <span className="text-xs text-slate-500">No reviews yet</span> // Nothing to show yet
          )}
        </div>
      </div>
    </Link>
  );
}
