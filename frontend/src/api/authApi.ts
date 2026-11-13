// ============================================================================
// api/authApi.ts
// Calls to /api/auth/* (register, login, current user).
// ============================================================================

import { api } from './client'; // Configured Axios instance
import type { AuthResponse, User } from '../types'; // Response types

/** POST /api/auth/login -> { token, user } */
export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password }); // Send credentials
  return data; // Token + user
}

/** POST /api/auth/register -> { token, user } */
export async function registerRequest(username: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { username, email, password }); // Create account
  return data; // Token + user
}

/** GET /api/auth/me -> { user } (requires a token) */
export async function fetchCurrentUser(): Promise<User> {
  const { data } = await api.get<{ user: User }>('/auth/me'); // Token is added by the interceptor
  return data.user; // Current user
}
