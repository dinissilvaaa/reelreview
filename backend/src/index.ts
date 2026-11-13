// ============================================================================
// index.ts
// Entry point: connects to MongoDB, optionally seeds demo data and starts
// the HTTP server. Also closes everything cleanly when the process stops.
// ============================================================================

import app from './app'; // The configured Express application
import { env } from './config/env'; // Configuration
import { connectDB, disconnectDB } from './config/db'; // Database connection helpers
import { seedDatabase } from './seed/seed'; // Demo data loader

async function start(): Promise<void> {
  try {
    await connectDB(env.mongoUri); // 1) Connect to MongoDB (throws if unreachable)

    if (env.seedOnStart) await seedDatabase(); // 2) Fill an empty database with demo data (SEED_ON_START=true)

    const server = app.listen(env.port, () => {
      console.log(`🚀 API running on http://localhost:${env.port} (${env.nodeEnv})`); // 3) Server is ready
    });

    // Graceful shutdown: stop accepting requests, then close the DB connection
    const shutdown = (signal: string): void => {
      console.log(`\n${signal} received, shutting down...`); // e.g. Ctrl+C sends SIGINT
      server.close(async () => {
        await disconnectDB(); // Close MongoDB connections
        process.exit(0); // Exit without error
      });
    };
    process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C in the terminal
    process.on('SIGTERM', () => shutdown('SIGTERM')); // `docker stop` / hosting platforms
  } catch (error) {
    console.error('❌ Failed to start the server:', error); // Usually: MongoDB is not running / wrong MONGO_URI
    process.exit(1); // Exit with an error code
  }
}

void start(); // Run it (void = we intentionally do not await at the top level)
