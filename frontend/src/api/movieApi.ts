// ============================================================================
// api/movieApi.ts
// Calls to /api/movies/* (browse, details, genres, admin CRUD).
// ============================================================================

import { api } from './client'; // Configured Axios instance
import type { Movie, MovieFormValues, MoviePage, MovieQuery } from '../types'; // Data types

/** GET /api/movies?search=&genre=&sort=&page=&limit= */
export async function fetchMovies(query: MovieQuery): Promise<MoviePage> {
  const { data } = await api.get<MoviePage>('/movies', { params: query }); // Axios turns `params` into a query string
  return data; // One page of movies + pagination info
}

/** GET /api/movies/:id */
export async function fetchMovie(id: string): Promise<Movie> {
  const { data } = await api.get<{ movie: Movie }>(`/movies/${id}`); // One movie
  return data.movie; // Unwrap
}

/** GET /api/movies/genres */
export async function fetchGenres(): Promise<string[]> {
  const { data } = await api.get<{ genres: string[] }>('/movies/genres'); // Allowed genres
  return data.genres; // Unwrap
}

/**
 * Converts the admin form values into multipart/form-data so a poster
 * image file can be uploaded together with the text fields.
 */
function toFormData(values: MovieFormValues): FormData {
  const form = new FormData(); // Browser API for multipart bodies
  form.append('title', values.title.trim()); // Text fields...
  form.append('description', values.description.trim());
  form.append('director', values.director.trim());
  form.append('releaseYear', values.releaseYear.trim());
  form.append('durationMinutes', values.durationMinutes.trim()); // '' clears the duration
  form.append('genres', values.genres.join(',')); // ['Action','Drama'] -> "Action,Drama"
  if (values.posterFile) form.append('poster', values.posterFile); // New image file (field name must be "poster")
  else form.append('posterUrl', values.posterUrl.trim()); // Or an external URL ('' removes the poster)
  return form; // Axios sets the multipart Content-Type header automatically
}

/** POST /api/movies (admin) */
export async function createMovie(values: MovieFormValues): Promise<Movie> {
  const { data } = await api.post<{ movie: Movie }>('/movies', toFormData(values)); // Upload form
  return data.movie; // Created movie
}

/** PUT /api/movies/:id (admin) */
export async function updateMovie(id: string, values: MovieFormValues): Promise<Movie> {
  const { data } = await api.put<{ movie: Movie }>(`/movies/${id}`, toFormData(values)); // Upload form
  return data.movie; // Updated movie
}

/** DELETE /api/movies/:id (admin) */
export async function deleteMovie(id: string): Promise<void> {
  await api.delete(`/movies/${id}`); // Nothing to return
}
