// ============================================================================
// pages/MovieDetailsPage.tsx
// Shows one movie (poster, info, rating summary) and its reviews.
// Logged-in users can write, edit and delete their own review here;
// admins can delete any review (moderation).
// ============================================================================

import { useEffect, useState } from 'react'; // React hooks
import { Link, useParams } from 'react-router-dom'; // Links + URL params
import { fetchMovie } from '../api/movieApi'; // Movie API
import { createReview, deleteReview, fetchMovieReviews, updateReview } from '../api/reviewApi'; // Review API
import { getErrorMessage } from '../api/client'; // Error -> text
import { useAuth } from '../hooks/useAuth'; // Current user
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { Poster } from '../components/Poster'; // Poster image
import { StarRating } from '../components/StarRating'; // Stars
import { RatingBreakdown } from '../components/RatingBreakdown'; // 5..1 star bars
import { ReviewForm } from '../components/ReviewForm'; // Write/edit form
import { ReviewItem } from '../components/ReviewItem'; // One review
import { Spinner } from '../components/Spinner'; // Loading indicator
import { Alert } from '../components/Alert'; // Message box
import { formatDuration, formatRating, pluralize } from '../utils/format'; // Display helpers
import type { Movie, Review, ReviewInput } from '../types'; // Types

// Data of the page, tagged with the movie id it belongs to
interface DetailsState {
  id: string; // Movie id these results belong to
  movie: Movie | null; // Movie (null on error)
  reviews: Review[]; // Its reviews
  error: string; // Error message ('' = none)
}

export function MovieDetailsPage() {
  const { id = '' } = useParams(); // Movie id from the URL /movies/:id
  const { user, isAdmin } = useAuth(); // Current user
  const [state, setState] = useState<DetailsState>({ id: '', movie: null, reviews: [], error: '' }); // Page data
  const [editing, setEditing] = useState(false); // Is my review being edited?
  const [notice, setNotice] = useState(''); // Success message
  const [actionError, setActionError] = useState(''); // Error from delete actions
  useDocumentTitle(state.movie?.title ?? 'Movie'); // Tab title = movie title

  // Load the movie and its reviews in parallel whenever the id changes
  useEffect(() => {
    let ignore = false; // Ignore late responses
    Promise.all([fetchMovie(id), fetchMovieReviews(id)]) // Two requests at once
      .then(([movie, reviews]) => {
        if (!ignore) setState({ id, movie, reviews, error: '' }); // Success
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ id, movie: null, reviews: [], error: getErrorMessage(error) }); // Failure (e.g. 404)
      });
    return () => {
      ignore = true; // Cleanup
    };
  }, [id]);

  const loading = state.id !== id; // Data for this id not loaded yet
  const myReview = user ? state.reviews.find((review) => review.user._id === user.id) : undefined; // My review, if any

  // Reload after a change (new average rating + updated list)
  const reload = async () => {
    const [movie, reviews] = await Promise.all([fetchMovie(id), fetchMovieReviews(id)]); // Fresh data
    setState({ id, movie, reviews, error: '' }); // Replace the old data
  };

  // Publish a new review (errors are shown by ReviewForm)
  const handleCreate = async (input: ReviewInput) => {
    await createReview(id, input); // POST
    await reload(); // Refresh
    setNotice('Thanks! Your review has been published.'); // Feedback
  };

  // Save changes to my review
  const handleUpdate = async (input: ReviewInput) => {
    if (!myReview) return; // Nothing to update
    await updateReview(myReview._id, input); // PUT
    await reload(); // Refresh
    setEditing(false); // Close the form
    setNotice('Your review has been updated.'); // Feedback
  };

  // Delete a review (mine, or any review if I am an admin)
  const handleDelete = async (review: Review) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return; // Ask for confirmation
    setActionError(''); // Clear old errors
    try {
      await deleteReview(review._id); // DELETE
      await reload(); // Refresh
      setEditing(false); // Close the form if it was open
      setNotice('The review has been deleted.'); // Feedback
    } catch (error) {
      setActionError(getErrorMessage(error)); // Show the problem
    }
  };

  if (loading) return <Spinner label="Loading movie..." />; // Waiting for data

  if (!state.movie) {
    // Error state (movie not found, server down...)
    return (
      <div className="space-y-4">
        <Alert type="error">{state.error || 'Movie not found.'}</Alert>
        <Link to="/" className="btn btn-secondary">
          ← Back to movies
        </Link>
      </div>
    );
  }

  const { movie, reviews } = state; // Shortcuts

  return (
    <div className="space-y-12">
      {/* Back link (navigate(-1) would leave the site if the page was opened directly, so we link home) */}
      <Link to="/" className="text-sm text-slate-400 hover:text-amber-300">
        ← Back to movies
      </Link>

      {/* ---- Movie information ---- */}
      <section className="grid gap-8 md:grid-cols-[280px_1fr]">
        {/* Poster (centred and smaller on phones) */}
        <div className="mx-auto w-56 md:w-full">
          <Poster title={movie.title} posterUrl={movie.posterUrl} className="rounded-2xl shadow-2xl shadow-black/50" />
        </div>

        <div className="space-y-6">
          {/* Title + meta line */}
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">{movie.title}</h1>
            <p className="mt-2 text-slate-400">
              {movie.releaseYear}
              {movie.durationMinutes ? ` · ${formatDuration(movie.durationMinutes)}` : ''} · Directed by{' '}
              <span className="text-slate-200">{movie.director}</span>
            </p>
          </div>

          {/* Genre badges (clicking one opens the filtered browse page) */}
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((genre) => (
              <Link key={genre} to={`/?genre=${encodeURIComponent(genre)}`} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-amber-400 hover:text-amber-300">
                {genre}
              </Link>
            ))}
          </div>

          {/* Rating summary */}
          <div className="card grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="text-center sm:pr-6">
              <p className="text-5xl font-extrabold text-amber-300">{movie.reviewCount > 0 ? formatRating(movie.averageRating) : '–'}</p>
              <StarRating value={movie.averageRating} size="md" />
              <p className="text-xs text-slate-400">{pluralize(movie.reviewCount, 'review')}</p>
            </div>
            <RatingBreakdown reviews={reviews} />
          </div>

          {/* Synopsis */}
          <div>
            <h2 className="mb-2 text-lg font-semibold text-white">Synopsis</h2>
            <p className="leading-relaxed text-slate-300">{movie.description}</p>
          </div>
        </div>
      </section>

      {/* ---- Reviews ---- */}
      <section className="space-y-5" aria-labelledby="reviews-title">
        <h2 id="reviews-title" className="text-2xl font-bold text-white">
          Reviews <span className="text-slate-500">({reviews.length})</span>
        </h2>

        {/* Feedback messages */}
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

        {/* Form area: depends on login state and whether I already reviewed */}
        {!user && (
          <div className="card flex flex-wrap items-center justify-between gap-3">
            <p className="text-slate-300">Want to share your opinion?</p>
            <Link to="/login" state={{ from: `/movies/${movie._id}` }} className="btn btn-primary">
              Log in to write a review
            </Link>
          </div>
        )}
        {user && !myReview && <ReviewForm submitLabel="Publish review" onSubmit={handleCreate} />}
        {user && myReview && editing && (
          <ReviewForm
            initialRating={myReview.rating}
            initialComment={myReview.comment}
            submitLabel="Save changes"
            onSubmit={handleUpdate}
            onCancel={() => setEditing(false)}
          />
        )}

        {/* List of reviews */}
        {reviews.length === 0 ? (
          <p className="text-slate-400">No reviews yet. Be the first to review this movie!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => {
              const isMine = review.user._id === user?.id; // Did I write it?
              return (
                <ReviewItem
                  key={review._id}
                  review={review}
                  canEdit={isMine && !editing} // Hide "Edit" while the form is already open
                  canDelete={isMine || isAdmin} // Authors and admins can delete
                  onEdit={() => setEditing(true)}
                  onDelete={() => void handleDelete(review)}
                />
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
