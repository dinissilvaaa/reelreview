// ============================================================================
// app.ts
// Builds and configures the Express application (middleware + routes).
// It does NOT start listening on a port: index.ts does that. Keeping them
// separate lets the automated tests import `app` without opening a port.
// ============================================================================

import express from 'express'; // Web framework
import cors from 'cors'; // Cross-Origin Resource Sharing (lets the frontend call the API)
import helmet from 'helmet'; // Sets secure HTTP headers
import morgan from 'morgan'; // Logs every HTTP request in the console
import { env } from './config/env'; // Configuration
import { UPLOADS_DIR } from './middleware/upload'; // Folder with uploaded posters
import { errorHandler, notFound } from './middleware/errorHandler'; // Error handling
import authRoutes from './routes/authRoutes'; // /api/auth/*
import movieRoutes from './routes/movieRoutes'; // /api/movies/*
import reviewRoutes from './routes/reviewRoutes'; // /api/reviews/*
import userRoutes from './routes/userRoutes'; // /api/users/*

const app = express(); // Create the application

if (env.trustProxy) app.set('trust proxy', 1); // Behind nginx: read the real client IP from X-Forwarded-For

// ---- Global middleware (runs for every request, in this order) -------------
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // Security headers (allow posters to load from another origin)
app.use(cors({ origin: env.clientUrls })); // Only our frontend URL(s) may call the API from a browser
app.use(express.json({ limit: '100kb' })); // Parse JSON bodies (max 100 KB)
app.use(express.urlencoded({ extended: false, limit: '100kb' })); // Parse classic HTML form bodies
if (!env.isTest) app.use(morgan(env.isProduction ? 'combined' : 'dev')); // Request logging (silent during tests)

// ---- Static files ----------------------------------------------------------
app.use('/uploads', express.static(UPLOADS_DIR, { maxAge: '7d' })); // Serve poster images, cached by browsers for 7 days

// ---- Health check (used by Docker and to quickly test the server) ----------
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptimeSeconds: Math.round(process.uptime()) }); // Simple "I am alive" answer
});

// ---- API routes ------------------------------------------------------------
app.use('/api/auth', authRoutes); // Register / login / me
app.use('/api/movies', movieRoutes); // Movies + nested reviews
app.use('/api/reviews', reviewRoutes); // My reviews / edit / delete
app.use('/api/users', userRoutes); // Admin user management

// ---- Errors (must be registered LAST) --------------------------------------
app.use(notFound); // No route matched -> 404
app.use(errorHandler); // Any error passed to next(error) -> JSON error response

export default app; // Used by index.ts and by the tests
