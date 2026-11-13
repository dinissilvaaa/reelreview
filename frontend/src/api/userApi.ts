// ============================================================================
// api/userApi.ts
// Calls to /api/users/* (admin panel).
// ============================================================================

import { api } from './client'; // Configured Axios instance
import type { AdminUser, User, UserRole } from '../types'; // Data types

/** GET /api/users (admin) */
export async function fetchUsers(): Promise<AdminUser[]> {
  const { data } = await api.get<{ users: AdminUser[] }>('/users'); // All users
  return data.users; // Unwrap
}

/** PATCH /api/users/:id/role (admin) */
export async function updateUserRole(userId: string, role: UserRole): Promise<User> {
  const { data } = await api.patch<{ user: User }>(`/users/${userId}/role`, { role }); // JSON body
  return data.user; // Updated user
}

/** DELETE /api/users/:id (admin) */
export async function deleteUser(userId: string): Promise<void> {
  await api.delete(`/users/${userId}`); // Nothing to return
}
