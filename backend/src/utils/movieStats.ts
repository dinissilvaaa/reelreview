// ============================================================================
// utils/movieStats.ts
// Recalculates a movie's averageRating and reviewCount from its reviews.
// Called every time a review is created, updated or deleted.
// ============================================================================

import { Types } from 'mongoose'; // ObjectId helper
import { Movie } from '../models/Movie'; // Movie model (where the stats are cached)
import { Review } from '../models/Review'; // Review model (source of the stats)

// Shape of one row returned by the aggregation below
interface RatingStats {
  average: number; // Average rating
  count: number; // Number of reviews
}

/**
 * Uses a MongoDB aggregation pipeline to compute the average rating
 * and review count of one movie, then stores them on the movie.
 */
export async function updateMovieRating(movieId: Types.ObjectId | string): Promise<void> {
  const id = new Types.ObjectId(String(movieId)); // Make sure we have an ObjectId (aggregations do not auto-cast)

  const [stats] = await Review.aggregate<RatingStats>([
    { $match: { movie: id } }, // Step 1: keep only the reviews of this movie
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } }, // Step 2: average + count
  ]);

  await Movie.findByIdAndUpdate(id, {
    averageRating: stats ? Math.round(stats.average * 10) / 10 : 0, // Round to 1 decimal (e.g. 4.3), 0 when no reviews
    reviewCount: stats?.count ?? 0, // 0 when no reviews
  });
}
