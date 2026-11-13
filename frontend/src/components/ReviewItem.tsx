// ============================================================================
// components/ReviewItem.tsx
// One review in the list on the movie details page.
// Shows Edit (author only) and Delete (author or admin) buttons.
// ============================================================================

import { StarRating } from './StarRating'; // Stars
import { formatDate } from '../utils/format'; // Date formatting
import type { Review } from '../types'; // Review type

interface ReviewItemProps {
  review: Review; // The review to show
  canEdit: boolean; // Current user is the author
  canDelete: boolean; // Current user is the author or an admin
  onEdit: () => void; // "Edit" clicked
  onDelete: () => void; // "Delete" clicked
}

export function ReviewItem({ review, canEdit, canDelete, onEdit, onDelete }: ReviewItemProps) {
  const edited = review.updatedAt !== review.createdAt; // Was it changed after publishing?

  return (
    <article className="card">
      {/* Header: avatar, name, date, stars */}
      <header className="flex flex-wrap items-center gap-3">
        {/* Avatar = first letter of the username */}
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-400/20 font-bold text-amber-300 uppercase" aria-hidden="true">
          {review.user.username.charAt(0)}
        </span>
        {/* Name + date */}
        <div className="mr-auto">
          <p className="font-semibold text-white">{review.user.username}</p>
          <p className="text-xs text-slate-500">
            {formatDate(review.createdAt)}
            {edited && ' · edited'}
          </p>
        </div>
        {/* Rating */}
        <StarRating value={review.rating} size="sm" />
      </header>

      {/* Comment (keeps the user's line breaks) */}
      {review.comment && <p className="mt-3 whitespace-pre-line text-slate-300">{review.comment}</p>}

      {/* Actions */}
      {(canEdit || canDelete) && (
        <div className="mt-4 flex gap-2">
          {canEdit && (
            <button type="button" className="btn btn-secondary px-3 py-1" onClick={onEdit}>
              Edit
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-danger px-3 py-1" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      )}
    </article>
  );
}
