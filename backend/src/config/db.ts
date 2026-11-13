// ============================================================================
// config/db.ts
// Opens and closes the connection to MongoDB using Mongoose.
// ============================================================================

import mongoose from 'mongoose'; // ODM (Object Document Mapper) for MongoDB

/**
 * Connects to MongoDB. Throws if the database cannot be reached,
 * so the caller (src/index.ts) can stop the server with a clear error.
 */
export async function connectDB(uri: string): Promise<void> {
  mongoose.set('strictQuery', true); // Ignore filter fields that are not in the schema (safer queries)
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 }); // Wait at most 10s for the database
  console.log(`✅ MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`); // Log host + database name
}

/**
 * Closes the MongoDB connection (used on shutdown and after the seed script).
 */
export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect(); // Close every open connection in the Mongoose pool
}
