// ============================================================================
// components/ReviewForm.tsx
// Form to write or edit a review: star picker + comment + submit.
// Validates on the client and shows server errors returned by onSubmit.
// ============================================================================

import { useState, type FormEvent } from 'react'; // State hook + form event type
import { StarRating } from './StarRating'; // Interactive stars
import { Alert } from './Alert'; // Error box
import { getErrorMessage } from '../api/client'; // Error -> text
import { hasErrors, MAX_COMMENT_LENGTH, validateReview, type FieldErrors, type ReviewValues } from '../utils/validation'; // Validation
import type { ReviewInput } from '../types'; // Data sent to the API

interface ReviewFormProps {
  initialRating?: number; // Pre-filled rating when editing
  initialComment?: string; // Pre-filled comment when editing
  submitLabel: string; // Button text ("Publish review" / "Save changes")
  onSubmit: (input: ReviewInput) => Promise<void>; // Called with valid data; may throw an API error
  onCancel?: () => void; // Optional "Cancel" button (edit mode)
}

export function ReviewForm({ initialRating = 0, initialComment = '', submitLabel, onSubmit, onCancel }: ReviewFormProps) {
  const [rating, setRating] = useState(initialRating); // Selected stars (0 = none yet)
  const [comment, setComment] = useState(initialComment); // Comment text
  const [errors, setErrors] = useState<FieldErrors<ReviewValues>>({}); // Field errors
  const [serverError, setServerError] = useState(''); // Error returned by the API
  const [submitting, setSubmitting] = useState(false); // Request in progress?

  // Form submit: validate -> call the API -> show errors if any
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Stop the browser from reloading the page
    const validation = validateReview({ rating, comment }); // Client-side checks
    setErrors(validation); // Show (or clear) field errors
    if (hasErrors(validation)) return; // Invalid -> stop here

    setSubmitting(true); // Disable the button
    setServerError(''); // Clear old server errors
    try {
      await onSubmit({ rating, comment: comment.trim() }); // Parent calls the API
    } catch (error) {
      setServerError(getErrorMessage(error)); // Show what went wrong
    } finally {
      setSubmitting(false); // Re-enable the button
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card space-y-4" noValidate>
      {/* Server error, if any */}
      {serverError && <Alert type="error">{serverError}</Alert>}

      {/* Star picker */}
      <div>
        <span className="label">Your rating</span>
        <StarRating
          value={rating}
          onChange={(value) => {
            setRating(value); // Save the chosen stars
            setErrors((previous) => ({ ...previous, rating: undefined })); // Hide the "choose a rating" error
          }}
          size="lg"
        />
        {errors.rating && <p className="field-error">{errors.rating}</p>}
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="label">
          Your review <span className="text-slate-500">(optional)</span>
        </label>
        <textarea
          id="review-comment" // Linked to the label
          rows={4} // Visible lines
          value={comment} // Controlled input
          onChange={(event) => setComment(event.target.value)} // Update on typing
          placeholder="What did you think about this movie?" // Hint
          className={`input resize-y ${errors.comment ? 'input-error' : ''}`} // Red border on error
        />
        {/* Live character counter (turns red when over the limit) */}
        <div className="mt-1 flex justify-between text-xs">
          <span className="field-error mt-0">{errors.comment}</span>
          <span className={comment.length > MAX_COMMENT_LENGTH ? 'text-red-400' : 'text-slate-500'}>
            {comment.length}/{MAX_COMMENT_LENGTH}
          </span>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
