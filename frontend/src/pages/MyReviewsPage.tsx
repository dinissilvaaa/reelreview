// ============================================================================
// pages/MyReviewsPage.tsx
// Lists every review written by the logged-in user (protected route).
// ============================================================================

import { useEffect, useState } from 'react'; // React hooks
import { Link } from 'react-router-dom'; // Navigation links
import { deleteReview, fetchMyReviews } from '../api/reviewApi'; // Review API
import { getErrorMessage } from '../api/client'; // Error -> text
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { Poster } from '../components/Poster'; // Poster thumbnail
import { StarRating } from '../components/StarRating'; // Stars
import { Spinner } from '../components/Spinner'; // Loading indicator
import { Alert } from '../components/Alert'; // Message box
import { formatDate, pluralize } from '../utils/format'; // Display helpers
import type { MyReview } from '../types'; // Type

interface MyReviewsState {
  loaded: boolean; // Has the first request finished?
  reviews: MyReview[]; // My reviews
  error: string; // Load error ('' = none)
}

export function MyReviewsPage() {
  useDocumentTitle('My reviews'); // Tab title
  const [state, setState] = useState<MyReviewsState>({ loaded: false, reviews: [], error: '' }); // Page data
  const [notice, setNotice] = useState(''); // Success message
  const [actionError, setActionError] = useState(''); // Delete error

  // Load my reviews once
  useEffect(() => {
    let ignore = false; // Ignore late responses
    fetchMyReviews() // GET /api/reviews/me
      .then((reviews) => {
        if (!ignore) setState({ loaded: true, reviews, error: '' }); // Success
      })
      .catch((error: unknown) => {
        if (!ignore) setState({ loaded: true, reviews: [], error: getErrorMessage(error) }); // Failure
      });
    return () => {
      ignore = true; // Cleanup
    };
  }, []);

  // Delete one review and remove it from the list without reloading
  const handleDelete = async (review: MyReview) => {
    const title = review.movie?.title ?? 'this movie'; // For the confirmation text
    if (!window.confirm(`Delete your review of "${title}"?`)) return; // Ask first
    setActionError(''); // Clear old errors
    try {
      await deleteReview(review._id); // DELETE /api/reviews/:id
      setState((previous) => ({ ...previous, reviews: previous.reviews.filter((item) => item._id !== review._id) })); // Remove locally
      setNotice(`Your review of "${title}" was deleted.`); // Feedback
    } catch (error) {
      setActionError(getErrorMessage(error)); // Show the problem
    }
  };

  if (!state.loaded) return <Spinner label="Loading your reviews..." />; // First load

  return (
    <div className="space-y-6">
      {/* Heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-white">My reviews</h1>
        <p className="mt-1 text-slate-400">{pluralize(state.reviews.length, 'review')} written by you.</p>
      </div>

      {/* Messages */}
      {state.error && <Alert type="error">{state.error}</Alert>}
      {actionError && (
        <Alert type="error" onClose={() => setActionError('')}>
          {actionError}
        </Alert>
      )}
      {notice && (
        <Alert type="success" onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {/* Empty state */}
      {!state.error && state.reviews.length === 0 && (
        <div className="card py-12 text-center">
          <p className="text-slate-300">You have not reviewed any movie yet.</p>
          <Link to="/" className="btn btn-primary mt-4">
            Browse movies
          </Link>
        </div>
      )}

      {/* List */}
      <ul className="space-y-4">
        {state.reviews.map((review) => (
          <li key={review._id} className="card flex gap-4">
            {/* Poster thumbnail */}
            <div className="w-20 shrink-0 overflow-hidden rounded-lg">
              <Poster title={review.movie?.title ?? 'Deleted movie'} posterUrl={review.movie?.posterUrl} compact />
            </div>

            {/* Text */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Movie title links to the details page */}
              {review.movie ? (
                <Link to={`/movies/${review.movie._id}`} className="text-lg font-semibold text-white hover:text-amber-300">
                  {review.movie.title} <span className="text-sm font-normal text-slate-500">({review.movie.releaseYear})</span>
                </Link>
              ) : (
                <p className="text-lg font-semibold text-slate-500">Deleted movie</p>
              )}
              {/* Stars + date */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <StarRating value={review.rating} size="sm" />
                <span>{formatDate(review.updatedAt)}</span>
              </div>
              {/* Comment */}
              {review.comment && <p className="line-clamp-3 text-sm text-slate-300">{review.comment}</p>}
              {/* Actions */}
              <div className="flex gap-2 pt-1">
                {review.movie && (
                  <Link to={`/movies/${review.movie._id}`} className="btn btn-secondary px-3 py-1">
                    View / edit
                  </Link>
                )}
                <button type="button" className="btn btn-danger px-3 py-1" onClick={() => void handleDelete(review)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
