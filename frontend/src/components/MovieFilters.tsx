// ============================================================================
// components/MovieFilters.tsx
// Search box + genre chips + sort selector for the browse page.
// The parent owns the real values (in the URL); this component only reports
// what the user chose through the on... callbacks.
// ============================================================================

import { useState, type FormEvent } from 'react'; // State hook + form event type
import type { SortOption } from '../types'; // Allowed sort values

// Options of the sort <select>
const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Recently added', // Default
  rating: 'Best rated',
  popular: 'Most reviewed',
  year: 'Release year',
  title: 'Title (A-Z)',
};

interface MovieFiltersProps {
  search: string; // Current search text
  genre: string; // Current genre ('' = all)
  sort: SortOption; // Current order
  genres: string[]; // Every available genre
  onSearch: (text: string) => void; // Called when the search form is submitted
  onGenreChange: (genre: string) => void; // Called when a genre chip is clicked
  onSortChange: (sort: SortOption) => void; // Called when the order changes
}

export function MovieFilters({ search, genre, sort, genres, onSearch, onGenreChange, onSortChange }: MovieFiltersProps) {
  const [text, setText] = useState(search); // What is typed in the box (submitted on Enter)

  // Submit handler: prevent the page reload and report the text
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Forms reload the page by default -> stop that
    onSearch(text.trim()); // Tell the parent
  };

  return (
    <div className="space-y-4">
      {/* Row 1: search + sort (stacked on phones, side by side on larger screens) */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <form onSubmit={handleSubmit} className="flex flex-1 gap-2" role="search">
          {/* Search input */}
          <label htmlFor="movie-search" className="sr-only">
            Search by title or director
          </label>
          <input
            id="movie-search" // Linked to the label above
            type="search" // Shows a clear "x" in most browsers
            value={text} // Controlled input: React state is the source of truth
            onChange={(event) => setText(event.target.value)} // Update the state on every keystroke
            placeholder="Search by title or director..." // Hint text
            maxLength={100} // Same limit as the API
            className="input"
          />
          {/* Submit button */}
          <button type="submit" className="btn btn-primary">
            Search
          </button>
        </form>

        {/* Sort selector */}
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <span className="whitespace-nowrap">Sort by</span>
          <select value={sort} onChange={(event) => onSortChange(event.target.value as SortOption)} className="input w-auto">
            {Object.entries(SORT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Row 2: genre chips (scroll horizontally on small screens) */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" aria-label="Filter by genre">
        {['', ...genres].map((item) => {
          const active = item === genre; // Is this chip the selected one?
          return (
            <button
              key={item || 'all'} // Unique key ('' -> 'all')
              type="button" // Plain button
              aria-pressed={active} // Toggle-button semantics for screen readers
              onClick={() => onGenreChange(item)} // Select this genre
              className={`shrink-0 rounded-full border px-3 py-1 text-sm transition ${
                active
                  ? 'border-amber-400 bg-amber-400 font-semibold text-slate-950' // Selected look
                  : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500' // Normal look
              }`}
            >
              {item || 'All genres'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
