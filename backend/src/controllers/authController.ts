// ============================================================================
// controllers/authController.ts
// Register, log in and "who am I" endpoints.
// Every handler uses async/await inside try/catch; errors go to next(error)
// and are turned into JSON responses by middleware/errorHandler.ts.
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import { User } from '../models/User'; // User model
import { HttpError } from '../utils/HttpError'; // Error with HTTP status
import { generateToken } from '../utils/token'; // Creates JWTs
import { toPublicUser } from '../utils/serializers'; // Removes private fields
import { validateLoginInput, validateRegisterInput } from '../utils/validators'; // Input checks
import { getAuthUser } from '../middleware/auth'; // Reads req.user safely

/**
 * POST /api/auth/register
 * Body: { username, email, password }
 * 201 -> { token, user }   400 -> invalid input   409 -> email/username taken
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validateRegisterInput(req.body); // Check the input first
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    const body = req.body as { username: string; email: string; password: string }; // Safe after validation
    const username = body.username.trim(); // Normalise username
    const email = body.email.trim().toLowerCase(); // Normalise email (same as the schema does)

    const existing = await User.findOne({ $or: [{ email }, { username }] }); // Is the email or username in use?
    if (existing) {
      const message = existing.email === email ? 'This email is already registered' : 'This username is already taken'; // Say which one
      throw new HttpError(409, message); // 409 Conflict
    }

    const user = await User.create({ username, email, password: body.password }); // The pre-save hook hashes the password
    const token = generateToken({ id: user._id.toString() }); // Log the new user in immediately

    res.status(201).json({ token, user: toPublicUser(user) }); // 201 Created
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 * 200 -> { token, user }   400 -> missing fields   401 -> wrong credentials
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const errors = validateLoginInput(req.body); // Both fields must be present
    if (errors.length > 0) throw new HttpError(400, 'Validation failed', errors); // Invalid -> 400

    const { email, password } = req.body as { email: string; password: string }; // Safe after validation
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password'); // Explicitly include the hidden hash

    // Same message for "no such email" and "wrong password" so attackers cannot discover which emails exist
    if (!user || !(await user.comparePassword(password))) {
      throw new HttpError(401, 'Invalid email or password'); // 401 Unauthorized
    }

    const token = generateToken({ id: user._id.toString() }); // New token for this session
    res.status(200).json({ token, user: toPublicUser(user) }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * GET /api/auth/me  (requires a token)
 * 200 -> { user }   401 -> not logged in   404 -> account deleted
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authUser = getAuthUser(req); // Set by the `protect` middleware
    const user = await User.findById(authUser.id); // Fresh data from the database
    if (!user) throw new HttpError(404, 'User not found'); // Account deleted meanwhile
    res.status(200).json({ user: toPublicUser(user) }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}
