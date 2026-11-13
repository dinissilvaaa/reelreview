// ============================================================================
// models/Movie.ts
// Mongoose schema + model for the "movies" collection.
// averageRating and reviewCount are cached here (recalculated every time a
// review changes) so the movie list can be sorted by rating quickly.
// ============================================================================

import { Schema, model, type HydratedDocument, type Types } from 'mongoose'; // Mongoose building blocks
import { GENRES, type Genre } from '../constants/genres'; // Allowed genre names

const CURRENT_YEAR = new Date().getFullYear(); // Used to limit the release year

// Shape of a movie document as stored in MongoDB
export interface IMovie {
  title: string; // Movie title, e.g. "Inception"
  description: string; // Short synopsis
  director: string; // Director name(s)
  releaseYear: number; // e.g. 2010
  durationMinutes?: number; // Runtime in minutes (optional)
  genres: Genre[]; // One or more genres from the fixed list
  posterUrl: string; // External image URL or "/uploads/<file>" for uploaded posters ('' = no poster)
  averageRating: number; // Average of all review ratings (0 when there are no reviews)
  reviewCount: number; // Number of reviews
  createdBy?: Types.ObjectId; // Admin user that created the movie
  createdAt: Date; // Added automatically by `timestamps: true`
  updatedAt: Date; // Added automatically by `timestamps: true`
}

export type MovieDocument = HydratedDocument<IMovie>; // A loaded movie document

// Schema definition with database-level validation
const movieSchema = new Schema<IMovie>(
  {
    title: {
      type: String, // Text
      required: [true, 'Title is required'], // Mandatory
      trim: true, // Remove surrounding spaces
      maxlength: [150, 'Title must have at most 150 characters'], // Length limit
    },
    description: {
      type: String, // Text
      required: [true, 'Description is required'], // Mandatory
      trim: true, // Remove surrounding spaces
      maxlength: [2000, 'Description must have at most 2000 characters'], // Length limit
    },
    director: {
      type: String, // Text
      required: [true, 'Director is required'], // Mandatory
      trim: true, // Remove surrounding spaces
      maxlength: [100, 'Director must have at most 100 characters'], // Length limit
    },
    releaseYear: {
      type: Number, // Numeric year
      required: [true, 'Release year is required'], // Mandatory
      min: [1888, 'Release year must be 1888 or later'], // 1888 = oldest surviving film
      max: [CURRENT_YEAR + 5, 'Release year is too far in the future'], // Allow announced movies
    },
    durationMinutes: {
      type: Number, // Minutes
      min: [1, 'Duration must be at least 1 minute'], // Must be positive
      max: [600, 'Duration must be at most 600 minutes'], // Sanity limit
    },
    genres: {
      type: [{ type: String, enum: { values: GENRES, message: '{VALUE} is not a valid genre' } }], // Array of allowed genres
      validate: {
        validator: (value: string[]) => value.length >= 1 && value.length <= 5, // Between 1 and 5 genres
        message: 'A movie must have between 1 and 5 genres', // Error when the rule fails
      },
    },
    posterUrl: {
      type: String, // URL/path text
      trim: true, // Remove surrounding spaces
      default: '', // Empty string = the frontend shows a generated placeholder poster
    },
    averageRating: {
      type: Number, // 0.0 - 5.0
      default: 0, // No reviews yet
      min: 0, // Lower bound
      max: 5, // Upper bound
    },
    reviewCount: {
      type: Number, // Integer counter
      default: 0, // No reviews yet
      min: 0, // Cannot be negative
    },
    createdBy: {
      type: Schema.Types.ObjectId, // Reference (foreign key) to a user
      ref: 'User', // Points to the User model (allows .populate('createdBy'))
    },
  },
  { timestamps: true, versionKey: false }, // Manage createdAt/updatedAt automatically and skip the internal "__v" field
);

movieSchema.index({ genres: 1 }); // Index to make "filter by genre" fast
movieSchema.index({ title: 1 }); // Index to make "sort/search by title" faster
movieSchema.index({ averageRating: -1 }); // Index to make "sort by best rated" fast

// Compile the schema into a model bound to the "movies" collection
export const Movie = model<IMovie>('Movie', movieSchema);
