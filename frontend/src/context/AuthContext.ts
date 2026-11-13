// ============================================================================
// context/AuthContext.ts
// The React Context object that shares the logged-in user with the whole app.
// The provider component lives in AuthProvider.tsx and the hook in hooks/useAuth.ts
// (kept in separate files so React Fast Refresh works correctly).
// ============================================================================

import { createContext } from 'react'; // React API to create a context
import type { User } from '../types'; // User type

// Everything components can read/do through useAuth()
export interface AuthContextValue {
  user: User | null; // Logged-in user, or null for visitors
  isAdmin: boolean; // Shortcut: user?.role === 'admin'
  initializing: boolean; // true while a saved token is being checked on page load
  login: (email: string, password: string) => Promise<void>; // Log in and store the token
  register: (username: string, email: string, password: string) => Promise<void>; // Create account + log in
  logout: () => void; // Forget the token and the user
}

// null by default: useAuth() throws a clear error if a component is outside <AuthProvider>
export const AuthContext = createContext<AuthContextValue | null>(null);
