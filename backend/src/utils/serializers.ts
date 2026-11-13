// ============================================================================
// utils/serializers.ts
// Converts database documents into the safe objects sent to the client.
// Using an explicit "public" shape guarantees we never leak fields such as
// the password hash, even if the model changes in the future.
// ============================================================================

import type { UserDocument } from '../models/User'; // Type of a loaded user
import type { UserRole } from '../constants/roles'; // 'user' | 'admin'

// What the API returns for a user
export interface PublicUser {
  id: string; // MongoDB _id as text
  username: string; // Public name
  email: string; // Email (only sent to the user themself or to admins)
  role: UserRole; // 'user' | 'admin'
  createdAt: Date; // Registration date
}

/** Picks only the public fields of a user document. */
export function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: user._id.toString(), // ObjectId -> string
    username: user.username, // Copy username
    email: user.email, // Copy email
    role: user.role, // Copy role
    createdAt: user.createdAt, // Copy registration date
  };
}
