// ============================================================================
// types/express.d.ts
// Extends Express's Request type with the `user` property that our
// authentication middleware (middleware/auth.ts) attaches to every
// authenticated request. Without this, `req.user` would be a type error.
// ============================================================================

import type { UserRole } from '../constants/roles'; // 'user' | 'admin'

declare global {
  namespace Express {
    // Data about the logged-in user, available as req.user in protected routes
    interface AuthUser {
      id: string; // MongoDB _id of the user
      username: string; // Username
      role: UserRole; // 'user' | 'admin'
    }

    // Merge our property into Express's own Request interface
    interface Request {
      user?: AuthUser; // Undefined on public routes, set by the `protect` middleware
    }
  }
}

export {}; // Makes this file a module so `declare global` is allowed
