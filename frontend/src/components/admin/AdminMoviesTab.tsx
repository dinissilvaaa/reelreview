// ============================================================================
// components/admin/AdminMoviesTab.tsx
// Admin panel tab: list, search, create, edit and delete movies.
// ============================================================================

import { useEffect, useState, type FormEvent } from 'react'; // React hooks + event type
import { Link } from 'react-router-dom'; // Navigation links
import { createMovie, deleteMovie, fetchGenres, fetchMovies, updateMovie } from '../../api/movieApi'; // Movie API
import { getErrorMessage } from '../../api/client'; // Error -> text
import { MovieForm } from './MovieForm'; // Create/edit form
import { Poster } from '../Poster'; // Thumbnail
import { Pagination } from '../Pagination'; // Page controls
import { Spinner } from '../Spinner'; // Loading indicator
import { Alert } from '../Alert'; // Message box
import { formatRating } from '../../utils/format'; // 4.25 -> "4.3"
import type { Movie, MovieFormValues, MoviePage } from '../../types'; // Types

const PAGE_SIZE = 10; // Rows per page

// Which form is open: none, "create" or "edit <movie>"
type EditorState = null | { mode: 'create' } | { mode: 'edit'; movie: Movie };

export function AdminMoviesTab() {
  const [page, setPage] = useState(1); // Current page
  const [searchInput, setSearchInput] = useState(''); // Text in the search box
  const [search, setSearch] = useState(''); // Search actually applied
  const [reloadCount, setReloadCount] = useState(0); // Increment to reload the list
  const [genres, setGenres] = useState<string[]>([]); // For the form
  const [editor, setEditor] = useState<EditorState>(null); // Open form
  const [notice, setNotice] = useState(''); // Success message
  const [actionError, setActionError] = useState(''); // Delete error
  const [state, setState] = useState<{ key: string; data: MoviePage | null; error: string }>({ key: '', data: null, error: '' }); // List data

  const requestKey = `${page}|${search}|${reloadCount}`; // Identifies the current request
  const loading = state.key !== requestKey; // Waiting for this request?

  // Load the genres once (needed by the form)
  useEffect(() => {
    let ignore = false; // Ignore late responses
    fetchGenres()
      .then((list) => {
        if (!ignore) setGenres(list); // Save them
      })
      .catch(() => undefined); // The form will show no chips; the API still validates
    return () => {
      ignore = true; // Cleanup
    };
  }, []);

  // Load one page of movies (sorted A-Z) whenever page/search/reloadCount changes
  useEffect(() => {
    let ignore = false; // Ignore late responses
    fetchMovies({ page, search: search || undefined, sort: 'title', limit: PAGE_SIZE })
      .then((data) => {
        if (!ignore) setState({ key: requestKey, data, error: '' }); // Success
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ key: requestKey, data: null, error: getErrorMessage(error) }); // Failure
      });
    return () => {
      ignore = true; // Cleanup
    };
  }, [requestKey, page, search]);

  const reload = () => setReloadCount((count) => count + 1); // Trigger the effect above again

  // Apply the search box
  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // No page reload
    setSearch(searchInput.trim()); // Apply the text
    setPage(1); // Back to the first page
  };

  // Save from the form (create or update). Errors are displayed by MovieForm.
  const handleSave = async (values: MovieFormValues) => {
    if (editor?.mode === 'edit') {
      const saved = await updateMovie(editor.movie._id, values); // PUT /api/movies/:id
      setNotice(`"${saved.title}" was updated.`); // Feedback
    } else {
      const saved = await createMovie(values); // POST /api/movies
      setNotice(`"${saved.title}" was added to the catalogue.`); // Feedback
    }
    setEditor(null); // Close the form
    reload(); // Refresh the list
  };

  // Delete a movie (after confirmation)
  const handleDelete = async (movie: Movie) => {
    if (!window.confirm(`Delete "${movie.title}" and all of its reviews? This cannot be undone.`)) return; // Ask first
    setActionError(''); // Clear old errors
    try {
      await deleteMovie(movie._id); // DELETE /api/movies/:id
      setNotice(`"${movie.title}" was deleted.`); // Feedback
      if (state.data?.movies.length === 1 && page > 1) setPage(page - 1); // Last item of the page -> previous page
      else reload(); // Otherwise refresh the current page
    } catch (error) {
      setActionError(getErrorMessage(error)); // Show the problem
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar: search + add */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearch} className="flex gap-2" role="search">
          <label htmlFor="admin-search" className="sr-only">
            Search movies
          </label>
          <input id="admin-search" type="search" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Search movies..." className="input" />
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
        <button type="button" className="btn btn-primary" onClick={() => setEditor({ mode: 'create' })} disabled={editor !== null}>
          + Add movie
        </button>
      </div>

      {/* Messages */}
      {notice && (
        <Alert type="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}
      {actionError && (
        <Alert type="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}

      {/* Form (key forces a fresh form when switching between movies) */}
      {editor && (
        <MovieForm
          key={editor.mode === 'edit' ? editor.movie._id : 'new'}
          genres={genres}
          movie={editor.mode === 'edit' ? editor.movie : undefined}
          onSubmit={handleSave}
          onCancel={() => setEditor(null)}
        />
      )}

      {/* List */}
      {!loading && state.error && <Alert type="error">{state.error}</Alert>}
      {loading && !state.data && <Spinner label="Loading movies..." />}
      {state.data && (
        <div className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
          {/* overflow-x-auto lets the table scroll sideways on small screens */}
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="bg-slate-900 text-xs text-slate-400 uppercase">
                <tr>
                  <th className="px-4 py-3">Movie</th>
                  <th className="px-4 py-3">Genres</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {state.data.movies.map((movie) => (
                  <tr key={movie._id} className="hover:bg-slate-900/60">
                    {/* Thumbnail + title + year */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 shrink-0 overflow-hidden rounded">
                          <Poster title={movie.title} posterUrl={movie.posterUrl} compact />
                        </div>
                        <div>
                          <Link to={`/movies/${movie._id}`} className="font-semibold text-white hover:text-amber-300">
                            {movie.title}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {movie.releaseYear} · {movie.director}
                          </p>
                        </div>
                      </div>
                    </td>
                    {/* Genres */}
                    <td className="px-4 py-3 text-slate-400">{movie.genres.join(', ')}</td>
                    {/* Rating */}
                    <td className="px-4 py-3 whitespace-nowrap text-slate-300">
                      {movie.reviewCount > 0 ? `★ ${formatRating(movie.averageRating)} (${movie.reviewCount})` : '—'}
                    </td>
                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button type="button" className="btn btn-secondary px-3 py-1" onClick={() => setEditor({ mode: 'edit', movie })}>
                          Edit
                        </button>
                        <button type="button" className="btn btn-danger px-3 py-1" onClick={() => void handleDelete(movie)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {/* Empty table */}
                {state.data.movies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                      No movies found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={state.data.page} totalPages={state.data.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
