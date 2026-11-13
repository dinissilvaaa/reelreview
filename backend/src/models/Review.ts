// ============================================================================
// models/Review.ts
// Mongoose schema + model for the "reviews" collection.
// A review links ONE user to ONE movie with a 1-5 star rating and a comment.
// A unique compound index guarantees one review per user per movie.
// ============================================================================

import { Schema, model, type HydratedDocument, type Types } from 'mongoose'; // Mongoose building blocks

// Shape of a review document as stored in MongoDB
export interface IReview {
  movie: Types.ObjectId; // Reviewed movie (reference to Movie)
  user: Types.ObjectId; // Author (reference to User)
  rating: number; // Whole number from 1 to 5 stars
  comment: string; // Optional text (may be '')
  createdAt: Date; // Added automatically by `timestamps: true`
  updatedAt: Date; // Added automatically by `timestamps: true`
}

export type ReviewDocument = HydratedDocument<IReview>; // A loaded review document

// Schema definition with database-level validation
const reviewSchema = new Schema<IReview>(
  {
    movie: {
      type: Schema.Types.ObjectId, // Reference to a movie
      ref: 'Movie', // Allows .populate('movie')
      required: [true, 'Movie is required'], // Every review belongs to a movie
      index: true, // Fast "all reviews of this movie" queries
    },
    user: {
      type: Schema.Types.ObjectId, // Reference to a user
      ref: 'User', // Allows .populate('user')
      required: [true, 'User is required'], // Every review has an author
      index: true, // Fast "all reviews of this user" queries
    },
    rating: {
      type: Number, // Number of stars
      required: [true, 'Rating is required'], // Mandatory
      min: [1, 'Rating must be between 1 and 5'], // Lowest rating
      max: [5, 'Rating must be between 1 and 5'], // Highest rating
      validate: { validator: Number.isInteger, message: 'Rating must be a whole number' }, // No 3.5 stars
    },
    comment: {
      type: String, // Free text
      trim: true, // Remove surrounding spaces
      maxlength: [1000, 'Comment must have at most 1000 characters'], // Length limit
      default: '', // A rating without a comment is allowed
    },
  },
  { timestamps: true, versionKey: false }, // Manage createdAt/updatedAt automatically and skip the internal "__v" field
);

// Unique compound index: the pair (movie, user) can only appear once
reviewSchema.index({ movie: 1, user: 1 }, { unique: true });

// Compile the schema into a model bound to the "reviews" collection
export const Review = model<IReview>('Review', reviewSchema);
