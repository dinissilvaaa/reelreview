// ============================================================================
// seed/runSeed.ts
// Command-line entry for the seed script:
//   npm run seed        (development, TypeScript)  -> wipes and re-creates demo data
//   npm run seed:prod   (after `npm run build`)    -> same, using compiled JS
// ============================================================================

import { env } from '../config/env'; // MONGO_URI and admin credentials
import { connectDB, disconnectDB } from '../config/db'; // Database connection helpers
import { seedDatabase } from './seed'; // The actual seeding logic

async function main(): Promise<void> {
  const reset = process.argv.includes('--reset'); // `--reset` flag -> wipe existing data first
  await connectDB(env.mongoUri); // Open the connection
  await seedDatabase({ reset }); // Insert the demo data
  await disconnectDB(); // Close the connection so the process can exit
  console.log('✅ Seed finished'); // Done
}

main().catch(async (error: unknown) => {
  console.error('❌ Seed failed:', error); // Show what went wrong
  await disconnectDB(); // Clean up
  process.exit(1); // Exit with an error code
});
