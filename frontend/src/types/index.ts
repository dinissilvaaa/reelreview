// ============================================================================
// types/index.ts
// TypeScript types that describe the data exchanged with the backend API.
// They mirror the JSON returned by the Express controllers.
// ============================================================================

export type UserRole = 'user' | 'admin'; // Normal account or administrator

// User returned by /api/auth/* (password is never sent)
export interface User {
  id: string; // MongoDB id
  username: string; // Public name
  email: string; // Login email
  role: UserRole; // Permission level
  createdAt: string; // ISO date string
}

// User as listed in the admin panel (with a review counter)
export interface AdminUser extends User {
  reviewCount: number; // How many reviews this user wrote
}

// Response of POST /api/auth/login and /api/auth/register
export interface AuthResponse {
  token: string; // JWT to send in the Authorization header
  user: User; // Logged-in user
}

// A movie document
export interface Movie {
  _id: string; // MongoDB id
  title: string; // Title
  description: string; // Synopsis
  director: string; // Director(s)
  releaseYear: number; // e.g. 2010
  durationMinutes?: number | null; // Runtime (optional)
  genres: string[]; // e.g. ['Action', 'Sci-Fi']
  posterUrl: string; // '' | 'https://...' | '/uploads/...'
  averageRating: number; // 0-5 with one decimal
  reviewCount: number; // Number of reviews
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Allowed values for the "sort" query parameter
export type SortOption = 'newest' | 'rating' | 'popular' | 'year' | 'title';

// Query parameters accepted by GET /api/movies
export interface MovieQuery {
  search?: string; // Text to look for in title/director
  genre?: string; // Genre filter
  sort?: SortOption; // Order
  page?: number; // Page number (1-based)
  limit?: number; // Items per page
}

// Response of GET /api/movies
export interface MoviePage {
  movies: Movie[]; // Current page
  page: number; // Current page number
  limit: number; // Page size
  total: number; // Total matches
  totalPages: number; // Number of pages
}

// Author info embedded in a review (populated by the backend)
export interface ReviewAuthor {
  _id: string; // User id
  username: string; // User name
}

// A review as returned by GET /api/movies/:id/reviews
export interface Review {
  _id: string; // MongoDB id
  movie: string; // Movie id
  user: ReviewAuthor; // Author
  rating: number; // 1-5
  comment: string; // Text ('' when empty)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// A review as returned by GET /api/reviews/me (movie populated instead of user)
export interface MyReview {
  _id: string; // MongoDB id
  movie: Pick<Movie, '_id' | 'title' | 'posterUrl' | 'releaseYear' | 'genres'> | null; // Small movie object
  user: string; // My user id
  rating: number; // 1-5
  comment: string; // Text
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Data sent when creating/updating a review
export interface ReviewInput {
  rating: number; // 1-5
  comment: string; // Optional text
}

// Values of the admin "movie" form (inputs hold strings, so numbers are strings here)
export interface MovieFormValues {
  title: string; // Title
  description: string; // Synopsis
  director: string; // Director(s)
  releaseYear: string; // "2010"
  durationMinutes: string; // "148" or ''
  genres: string[]; // Selected genres
  posterUrl: string; // External URL (or current uploaded path)
  posterFile: File | null; // New image chosen in the file picker
}
