// ============================================================================
// pages/HomePage.tsx
// Browse page: hero banner, search, genre filter, sort and paginated grid.
// The filters live in the URL (?search=&genre=&sort=&page=), so results can
// be bookmarked/shared and the browser Back button works as expected.
// ============================================================================

import { useEffect, useState } from 'react'; // React hooks
import { useSearchParams } from 'react-router-dom'; // Read/write the URL query string
import { fetchGenres, fetchMovies } from '../api/movieApi'; // API calls
import { getErrorMessage } from '../api/client'; // Error -> text
import { MovieCard } from '../components/MovieCard'; // Grid item
import { MovieFilters } from '../components/MovieFilters'; // Search / genre / sort controls
import { Pagination } from '../components/Pagination'; // Page controls
import { Spinner } from '../components/Spinner'; // Loading indicator
import { Alert } from '../components/Alert'; // Message box
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { pluralize } from '../utils/format'; // "1 movie" / "2 movies"
import type { MoviePage, SortOption } from '../types'; // Types

const PAGE_SIZE = 12; // Movies per page
const VALID_SORTS: SortOption[] = ['newest', 'rating', 'popular', 'year', 'title']; // Accepted ?sort= values

// Result of the last request, tagged with the request it belongs to
interface MoviesState {
  key: string; // Which filters produced this result
  data: MoviePage | null; // The movies (null on error / before the first load)
  error: string; // Error message ('' = none)
}

export function HomePage() {
  useDocumentTitle('Browse movies'); // Tab title

  // ---- Read the filters from the URL ----
  const [searchParams, setSearchParams] = useSearchParams(); // URL query string
  const search = searchParams.get('search') ?? ''; // ?search=
  const genre = searchParams.get('genre') ?? ''; // ?genre=
  const sortParam = searchParams.get('sort') as SortOption | null; // ?sort=
  const sort: SortOption = sortParam && VALID_SORTS.includes(sortParam) ? sortParam : 'newest'; // Fallback to "newest"
  const page = Math.max(1, Number(searchParams.get('page')) || 1); // ?page= (at least 1)

  const [genres, setGenres] = useState<string[]>([]); // Genre chips
  const [attempt, setAttempt] = useState(0); // Increment to retry after an error
  const [state, setState] = useState<MoviesState>({ key: '', data: null, error: '' }); // Last result

  const requestKey = `${search}|${genre}|${sort}|${page}|${attempt}`; // Unique id of the current request
  const loading = state.key !== requestKey; // Still waiting if the stored result belongs to another request

  // Load the genre list once
  useEffect(() => {
    let ignore = false; // Ignore the answer if the page is left before it arrives
    fetchGenres()
      .then((list) => {
        if (!ignore) setGenres(list); // Save the genres
      })
      .catch(() => undefined); // Not critical: the page still works without chips
    return () => {
      ignore = true; // Cleanup
    };
  }, []);

  // Load the movies every time the filters change
  useEffect(() => {
    let ignore = false; // Prevents an old, slow response from overwriting a newer one
    fetchMovies({ search: search || undefined, genre: genre || undefined, sort, page, limit: PAGE_SIZE }) // GET /api/movies
      .then((data) => {
        if (!ignore) setState({ key: requestKey, data, error: '' }); // Success
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ key: requestKey, data: null, error: getErrorMessage(error) }); // Failure
      });
    return () => {
      ignore = true; // Cleanup when the filters change again or the page unmounts
    };
  }, [requestKey, search, genre, sort, page]);

  // Write new filter values into the URL (empty values are removed)
  const updateParams = (changes: Record<string, string>, resetPage = true) => {
    const next = new URLSearchParams(searchParams); // Copy the current params
    Object.entries(changes).forEach(([key, value]) => (value ? next.set(key, value) : next.delete(key))); // Apply changes
    if (resetPage) next.delete('page'); // New filters -> back to page 1
    setSearchParams(next); // Update the URL (triggers a re-render)
  };

  // Change page and scroll up smoothly
  const goToPage = (newPage: number) => {
    updateParams({ page: newPage > 1 ? String(newPage) : '' }, false); // Keep the other filters
    window.scrollTo({ top: 0, behavior: 'smooth' }); // DOM API: smooth scroll to the top
  };

  const hasFilters = search !== '' || genre !== ''; // Is anything filtering the list?

  return (
    <div className="space-y-8">
      {/* ---- Hero banner ---- */}
      <section className="overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-br from-amber-400/15 via-slate-900 to-slate-950 px-6 py-10 sm:px-10 sm:py-14">
        <p className="text-sm font-semibold tracking-widest text-amber-300 uppercase">Your movie diary</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
          Discover, rate &amp; review the movies you love.
        </h1>
        <p className="mt-4 max-w-xl text-slate-300">
          Browse the catalogue, filter by genre, read what other fans think and share your own opinion with a 1-5 star rating.
        </p>
      </section>

      {/* ---- Filters (key resets the search box when the URL search changes) ---- */}
      <MovieFilters
        key={search}
        search={search}
        genre={genre}
        sort={sort}
        genres={genres}
        onSearch={(text) => updateParams({ search: text })}
        onGenreChange={(value) => updateParams({ genre: value })}
        onSortChange={(value) => updateParams({ sort: value === 'newest' ? '' : value })}
      />

      {/* ---- Error with a retry button ---- */}
      {!loading && state.error && (
        <Alert type="error">
          {state.error}{' '}
          <button type="button" className="font-semibold underline" onClick={() => setAttempt((count) => count + 1)}>
            Try again
          </button>
        </Alert>
      )}

      {/* ---- First load ---- */}
      {loading && !state.data && <Spinner label="Loading movies..." />}

      {/* ---- Results (dimmed while new results load) ---- */}
      {state.data && (
        <section aria-busy={loading} className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* Result count + clear filters */}
          <div className="mb-4 flex items-center justify-between text-sm text-slate-400">
            <p>{pluralize(state.data.total, 'movie')} found</p>
            {hasFilters && (
              <button type="button" className="text-amber-300 hover:underline" onClick={() => setSearchParams({})}>
                Clear filters
              </button>
            )}
          </div>

          {state.data.movies.length === 0 ? (
            // Empty state
            <div className="card py-16 text-center">
              <p className="text-4xl" aria-hidden="true">🍿</p>
              <p className="mt-3 text-slate-300">No movies match your search.</p>
            </div>
          ) : (
            // Responsive grid: 2 columns on phones up to 6 on large screens
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {state.data.movies.map((movie) => (
                <MovieCard key={movie._id} movie={movie} />
              ))}
            </div>
          )}

          {/* Page controls */}
          <Pagination page={state.data.page} totalPages={state.data.totalPages} onPageChange={goToPage} />
        </section>
      )}
    </div>
  );
}
