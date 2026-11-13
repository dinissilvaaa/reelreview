// ============================================================================
// seed/seed.ts
// Inserts the demo data from seedData.ts into MongoDB.
//   seedDatabase()               -> only seeds when there are no movies yet
//   seedDatabase({ reset: true}) -> wipes users/movies/reviews first
// ============================================================================

import { User, type UserDocument } from '../models/User'; // User model
import { Movie } from '../models/Movie'; // Movie model
import { Review } from '../models/Review'; // Review model
import { env } from '../config/env'; // Admin credentials
import { updateMovieRating } from '../utils/movieStats'; // Average rating recalculation
import { buildSeedUsers, SEED_MOVIES, SEED_REVIEWS, type SeedAuthor } from './seedData'; // Demo data

/**
 * Finds each demo user by email or creates it when missing.
 * Returns the documents indexed by their short key ('admin', 'demo', 'critic').
 */
async function getOrCreateUsers(): Promise<Record<SeedAuthor, UserDocument>> {
  const result = {} as Record<SeedAuthor, UserDocument>; // Filled in the loop below
  for (const seedUser of buildSeedUsers(env.adminEmail, env.adminPassword)) {
    const existing = await User.findOne({ email: seedUser.email.toLowerCase() }); // Already there?
    result[seedUser.key] =
      existing ?? // Reuse it...
      (await User.create({
        username: seedUser.username, // ...or create it
        email: seedUser.email,
        password: seedUser.password, // Hashed by the pre-save hook
        role: seedUser.role,
      }));
  }
  return result; // { admin, demo, critic }
}

/**
 * Seeds demo users, movies and reviews.
 */
export async function seedDatabase({ reset = false }: { reset?: boolean } = {}): Promise<void> {
  if (reset) {
    await Promise.all([Review.deleteMany({}), Movie.deleteMany({}), User.deleteMany({})]); // Wipe the three collections
    console.log('🧹 Database cleared'); // Feedback in the console
  } else if ((await Movie.estimatedDocumentCount()) > 0) {
    console.log('ℹ️  Database already has movies - skipping demo data'); // Never overwrite real data
    return; // Nothing to do
  }

  const users = await getOrCreateUsers(); // 1) Accounts

  const movies = await Movie.insertMany(
    SEED_MOVIES.map((movie) => ({ ...movie, createdBy: users.admin._id })), // 2) Movies, "created" by the admin
  );

  const movieByTitle = new Map(movies.map((movie) => [movie.title, movie])); // Title -> document (to link reviews)

  const reviews = SEED_REVIEWS.map((review) => {
    const movie = movieByTitle.get(review.movieTitle); // Find the reviewed movie
    if (!movie) throw new Error(`Seed review references unknown movie "${review.movieTitle}"`); // Typo protection
    return { movie: movie._id, user: users[review.author]._id, rating: review.rating, comment: review.comment }; // Review document
  });
  await Review.insertMany(reviews); // 3) Reviews

  await Promise.all(movies.map((movie) => updateMovieRating(movie._id))); // 4) Compute every average rating

  console.log(`🌱 Seeded ${Object.keys(users).length} users, ${movies.length} movies and ${reviews.length} reviews`); // Summary
}
