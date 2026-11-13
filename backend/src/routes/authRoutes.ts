// ============================================================================
// routes/authRoutes.ts
// Mounted at /api/auth in app.ts.
// ============================================================================

import { Router } from 'express'; // Express router (a mini-app for a group of routes)
import { getMe, login, register } from '../controllers/authController'; // Handlers
import { protect } from '../middleware/auth'; // Requires a valid token
import { authLimiter } from '../middleware/rateLimiter'; // Slows down brute-force attempts

const router = Router(); // New router instance

router.post('/register', authLimiter, register); // POST /api/auth/register -> create an account
router.post('/login', authLimiter, login); // POST /api/auth/login    -> get a token
router.get('/me', protect, getMe); // GET  /api/auth/me       -> current user (token required)

export default router; // Exported so app.ts can mount it
