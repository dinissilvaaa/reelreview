// ============================================================================
// controllers/userController.ts
// Admin panel endpoints to manage user accounts.
// All routes are protected by `protect` + `adminOnly` (routes/userRoutes.ts).
// ============================================================================

import type { NextFunction, Request, Response } from 'express'; // Express types
import type { Types } from 'mongoose'; // ObjectId type
import { User } from '../models/User'; // User model
import { Review } from '../models/Review'; // Review model
import { isUserRole } from '../constants/roles'; // Role validation
import { HttpError } from '../utils/HttpError'; // Error with HTTP status
import { toPublicUser } from '../utils/serializers'; // Removes private fields
import { updateMovieRating } from '../utils/movieStats'; // Average rating recalculation
import { getAuthUser } from '../middleware/auth'; // Reads req.user safely

/**
 * GET /api/users  (admin)
 * Every user with the number of reviews they wrote.
 * 200 -> { users }
 */
export async function getUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const [users, reviewCounts] = await Promise.all([
      User.find().sort({ createdAt: -1 }), // Newest accounts first
      Review.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $group: { _id: '$user', count: { $sum: 1 } } }, // Count reviews per user
      ]),
    ]);

    const countByUser = new Map(reviewCounts.map((row) => [row._id.toString(), row.count])); // userId -> count

    res.status(200).json({
      users: users.map((user) => ({
        ...toPublicUser(user), // Safe public fields
        reviewCount: countByUser.get(user._id.toString()) ?? 0, // 0 when the user has no reviews
      })),
    }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * PATCH /api/users/:id/role  (admin)
 * Body: { role: 'user' | 'admin' }
 * 200 -> { user }   400 -> invalid role / own account   404 -> not found
 */
export async function updateUserRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = getAuthUser(req); // The admin making the change
    const role: unknown = req.body?.role; // Requested role

    if (!isUserRole(role)) throw new HttpError(400, 'Role must be "user" or "admin"'); // Unknown role
    if (req.params.id === admin.id) throw new HttpError(400, 'You cannot change your own role'); // Avoid locking yourself out

    const user = await User.findByIdAndUpdate(
      req.params.id, // Which user
      { role }, // What to change
      { returnDocument: 'after', runValidators: true }, // Return the updated document and validate it
    );
    if (!user) throw new HttpError(404, 'User not found'); // No such user

    res.status(200).json({ user: toPublicUser(user) }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}

/**
 * DELETE /api/users/:id  (admin)
 * Deletes the account and all its reviews, then fixes the affected ratings.
 * 200 -> { message, id }   400 -> own account   404 -> not found
 */
export async function deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = getAuthUser(req); // The admin making the change
    if (req.params.id === admin.id) throw new HttpError(400, 'You cannot delete your own account'); // Safety rule

    const user = await User.findById(req.params.id); // Load the user
    if (!user) throw new HttpError(404, 'User not found'); // No such user

    const movieIds: Types.ObjectId[] = await Review.distinct('movie', { user: user._id }); // Movies this user reviewed
    await Review.deleteMany({ user: user._id }); // Remove their reviews
    await Promise.all(movieIds.map((movieId) => updateMovieRating(movieId))); // Recalculate those movies' ratings
    await user.deleteOne(); // Remove the account

    res.status(200).json({ message: 'User deleted successfully', id: user._id }); // 200 OK
  } catch (error) {
    next(error); // Let the error handler build the response
  }
}
