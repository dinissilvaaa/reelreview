// ============================================================================
// components/admin/MovieForm.tsx
// Create / edit form for a movie (admin panel).
// Supports uploading a poster image (with live preview) or pasting a URL.
// ============================================================================

import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'; // React hooks + event types
import { FormField } from '../FormField'; // Label + input + error
import { Poster } from '../Poster'; // Poster preview
import { Alert } from '../Alert'; // Message box
import { getErrorMessage } from '../../api/client'; // Error -> text
import { ALLOWED_POSTER_TYPES, hasErrors, validateMovieForm, type FieldErrors } from '../../utils/validation'; // Validation
import type { Movie, MovieFormValues } from '../../types'; // Types

interface MovieFormProps {
  genres: string[]; // Every available genre (checkbox chips)
  movie?: Movie; // Movie being edited (undefined = create mode)
  onSubmit: (values: MovieFormValues) => Promise<void>; // Parent calls the API; may throw
  onCancel: () => void; // Close the form
}

// Converts a movie (or nothing) into form values (inputs work with strings)
function toFormValues(movie?: Movie): MovieFormValues {
  return {
    title: movie?.title ?? '', // Title or empty
    description: movie?.description ?? '', // Synopsis or empty
    director: movie?.director ?? '', // Director or empty
    releaseYear: movie ? String(movie.releaseYear) : '', // 2010 -> "2010"
    durationMinutes: movie?.durationMinutes ? String(movie.durationMinutes) : '', // 148 -> "148"
    genres: movie?.genres ?? [], // Selected genres
    posterUrl: movie?.posterUrl ?? '', // Current poster
    posterFile: null, // No new file yet
  };
}

export function MovieForm({ genres, movie, onSubmit, onCancel }: MovieFormProps) {
  const [values, setValues] = useState<MovieFormValues>(() => toFormValues(movie)); // Form values (lazy initial state)
  const [errors, setErrors] = useState<FieldErrors<MovieFormValues>>({}); // Field errors
  const [serverError, setServerError] = useState(''); // API error
  const [submitting, setSubmitting] = useState(false); // Request in progress?
  const fileInputRef = useRef<HTMLInputElement>(null); // Direct DOM reference to the file input (to reset it)

  // Temporary local URL so the chosen image can be previewed before uploading
  const previewUrl = useMemo(() => (values.posterFile ? URL.createObjectURL(values.posterFile) : ''), [values.posterFile]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Free the memory when the preview changes/unmounts
    };
  }, [previewUrl]);

  // Text inputs and textarea share one handler (keyed by the "name" attribute)
  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target; // Field + value
    setValues((previous) => ({ ...previous, [name]: value })); // Update one field
    setErrors((previous) => ({ ...previous, [name]: undefined })); // The user is fixing it -> hide its old error
  };

  // Add or remove a genre from the selection
  const toggleGenre = (genre: string) => {
    setErrors((previous) => ({ ...previous, genres: undefined })); // Hide the old genres error
    setValues((previous) => ({
      ...previous,
      genres: previous.genres.includes(genre)
        ? previous.genres.filter((item) => item !== genre) // Already selected -> remove
        : [...previous.genres, genre], // Not selected -> add
    }));
  };

  // A file was chosen in the file picker
  const handleFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null; // First (only) file, or null
    setValues((previous) => ({ ...previous, posterFile: file })); // Store it
    setErrors((previous) => ({ ...previous, posterFile: undefined, posterUrl: undefined })); // Hide old poster errors
  };

  // Remove the chosen file
  const clearFile = () => {
    setValues((previous) => ({ ...previous, posterFile: null })); // Forget the file
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset the <input type="file"> in the DOM
  };

  // Submit: validate -> parent saves -> parent closes the form
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // No page reload
    const validation = validateMovieForm(values); // Client-side checks
    setErrors(validation); // Show/clear errors
    if (hasErrors(validation)) return; // Stop if invalid

    setSubmitting(true); // Disable the buttons
    setServerError(''); // Clear old errors
    try {
      await onSubmit(values); // POST or PUT (multipart/form-data)
    } catch (error) {
      setServerError(getErrorMessage(error)); // Show the problem
      setSubmitting(false); // Allow another try
    }
  };

  // Helper to build the props shared by the text inputs
  const inputProps = (name: 'title' | 'director' | 'releaseYear' | 'durationMinutes' | 'posterUrl') => ({
    id: `movie-${name}`, // Unique id (matches the FormField label)
    name, // Key used by handleChange
    value: values[name], // Controlled value
    onChange: handleChange, // Update state
    'aria-invalid': Boolean(errors[name]), // Accessibility
    'aria-describedby': errors[name] ? `movie-${name}-error` : undefined, // Link to the error text
    className: `input ${errors[name] ? 'input-error' : ''}`, // Red border on error
  });

  return (
    <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
      {/* Heading */}
      <h2 className="text-xl font-bold text-white">{movie ? `Edit "${movie.title}"` : 'Add a new movie'}</h2>

      {/* API error */}
      {serverError && <Alert type="error">{serverError}</Alert>}

      <div className="grid gap-6 md:grid-cols-[1fr_160px]">
        {/* ---- Left: text fields ---- */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FormField id="movie-title" label="Title *" error={errors.title}>
              <input type="text" maxLength={150} {...inputProps('title')} />
            </FormField>
          </div>
          <FormField id="movie-director" label="Director *" error={errors.director}>
            <input type="text" maxLength={100} {...inputProps('director')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField id="movie-releaseYear" label="Year *" error={errors.releaseYear}>
              <input type="number" inputMode="numeric" min={1888} {...inputProps('releaseYear')} />
            </FormField>
            <FormField id="movie-durationMinutes" label="Minutes" error={errors.durationMinutes}>
              <input type="number" inputMode="numeric" min={1} max={600} {...inputProps('durationMinutes')} />
            </FormField>
          </div>
          <div className="sm:col-span-2">
            <FormField id="movie-description" label="Synopsis *" error={errors.description}>
              <textarea
                id="movie-description"
                name="description"
                rows={4}
                maxLength={2000}
                value={values.description}
                onChange={handleChange}
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'movie-description-error' : undefined}
                className={`input resize-y ${errors.description ? 'input-error' : ''}`}
              />
            </FormField>
          </div>
        </div>

        {/* ---- Right: poster preview ---- */}
        <div className="mx-auto w-40 md:w-full">
          <span className="label">Preview</span>
          <Poster title={values.title || 'New movie'} posterUrl={previewUrl || values.posterUrl} className="rounded-lg" />
        </div>
      </div>

      {/* ---- Genres (toggle chips) ---- */}
      <fieldset>
        <legend className="label">Genres * (1-5)</legend>
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => {
            const selected = values.genres.includes(genre); // Is it selected?
            return (
              <button
                key={genre}
                type="button"
                aria-pressed={selected} // Toggle-button semantics
                onClick={() => toggleGenre(genre)} // Select / unselect
                className={`rounded-full border px-3 py-1 text-sm transition ${
                  selected ? 'border-amber-400 bg-amber-400 font-semibold text-slate-950' : 'border-slate-700 text-slate-300 hover:border-slate-500'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
        {errors.genres && <p className="field-error">{errors.genres}</p>}
      </fieldset>

      {/* ---- Poster: upload a file OR paste a URL ---- */}
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="movie-poster-file" label="Upload poster (JPG, PNG, WEBP, GIF · max 2 MB)" error={errors.posterFile}>
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef} // DOM reference (used by clearFile)
              id="movie-poster-file"
              type="file" // File picker
              accept={ALLOWED_POSTER_TYPES.join(',')} // Only show images in the picker
              onChange={handleFile} // Store the chosen file
              className="block w-full text-sm text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-700 file:px-3 file:py-2 file:text-slate-100 hover:file:bg-slate-600"
            />
            {values.posterFile && (
              <button type="button" className="btn btn-ghost px-2" onClick={clearFile} aria-label="Remove selected file">
                ✕
              </button>
            )}
          </div>
        </FormField>
        <FormField id="movie-posterUrl" label="...or poster URL" error={errors.posterUrl} hint={values.posterFile ? 'Ignored while a file is selected' : 'Leave empty for a generated placeholder'}>
          <input type="url" placeholder="https://..." disabled={Boolean(values.posterFile)} {...inputProps('posterUrl')} />
        </FormField>
      </div>

      {/* ---- Buttons ---- */}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving...' : movie ? 'Save changes' : 'Add movie'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
      </div>
    </form>
  );
}
