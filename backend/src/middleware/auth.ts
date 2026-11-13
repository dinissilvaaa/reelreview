// ============================================================================
// middleware/auth.ts
// Authentication (who are you?) and authorization (are you allowed?).
//   protect   -> requires a valid JWT, attaches req.user
//   adminOnly -> requires req.user.role === 'admin' (use AFTER protect)
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import { User } from '../models/User'; // Used to load the user from the token id
import { verifyToken } from '../utils/token'; // JWT verification helper
import { HttpError } from '../utils/HttpError'; // Error with HTTP status

/**
 * Reads "Authorization: Bearer <token>", verifies it and loads the user.
 * Responds 401 Unauthorized when the token is missing, invalid or expired.
 */
export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization; // e.g. "Bearer eyJhbGciOi..."

  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Not authorized: please log in' }); // No token at all
    return; // Stop here, do not call next()
  }

  const token = header.slice('Bearer '.length).trim(); // Keep only the token part

  try {
    const { id } = verifyToken(token); // Throws if the signature is wrong or the token expired
    const user = await User.findById(id); // Load the user (role may have changed since login)
    if (!user) {
      res.status(401).json({ message: 'Not authorized: this account no longer exists' }); // Deleted account
      return; // Stop here
    }
    req.user = { id: user._id.toString(), username: user.username, role: user.role }; // Make the user available to controllers
    next(); // Continue to the next middleware/controller
  } catch {
    res.status(401).json({ message: 'Not authorized: invalid or expired token' }); // Bad token
  }
}

/**
 * Allows the request only for admins. Must run after `protect`.
 * Responds 403 Forbidden for logged-in users that are not admins.
 */
export function adminOnly(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ message: 'Forbidden: admin access required' }); // Logged in, but not allowed
    return; // Stop here
  }
  next(); // Admin -> continue
}

/**
 * Returns req.user or throws 401. Controllers behind `protect` use this
 * instead of `req.user!` so TypeScript knows the user exists.
 */
export function getAuthUser(req: Request): Express.AuthUser {
  if (!req.user) throw new HttpError(401, 'Not authorized: please log in'); // Should never happen behind `protect`
  return req.user; // The logged-in user
}
