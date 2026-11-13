// ============================================================================
// context/AuthProvider.tsx
// Holds the authentication state (current user) and exposes login/logout.
// On page load it restores the session from the token saved in localStorage.
// ============================================================================

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'; // React hooks + types
import { AuthContext, type AuthContextValue } from './AuthContext'; // The context object
import { fetchCurrentUser, loginRequest, registerRequest } from '../api/authApi'; // Auth API calls
import { clearToken, getStoredToken, storeToken, UNAUTHORIZED_EVENT } from '../api/client'; // Token helpers
import type { User } from '../types'; // User type

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); // Current user (null = visitor)
  const [initializing, setInitializing] = useState(() => getStoredToken() !== null); // Only "loading" if a token exists

  // 1) On first render: if a token was saved, ask the backend who it belongs to
  useEffect(() => {
    if (!getStoredToken()) return; // No saved session -> nothing to restore
    let ignore = false; // Becomes true if the component unmounts before the request ends
    fetchCurrentUser() // GET /api/auth/me
      .then((currentUser) => {
        if (!ignore) setUser(currentUser); // Token valid -> we are logged in
      })
      .catch(() => clearToken()) // Token expired/invalid -> forget it
      .finally(() => {
        if (!ignore) setInitializing(false); // Done checking either way
      });
    return () => {
      ignore = true; // Cleanup: ignore late responses
    };
  }, []); // [] = run once

  // 2) Listen for the "unauthorized" event fired by the Axios interceptor (token expired mid-session)
  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken(); // Remove the bad token
      setUser(null); // Back to visitor mode
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized); // Subscribe to the DOM event
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized); // Unsubscribe on unmount
  }, []); // [] = subscribe once

  // Log in: call the API, save the token, store the user
  const login = useCallback(async (email: string, password: string) => {
    const { token, user: loggedUser } = await loginRequest(email, password); // Throws on wrong credentials
    storeToken(token); // Persist the session
    setUser(loggedUser); // Update the UI
  }, []);

  // Register: same as login, but creates the account first
  const register = useCallback(async (username: string, email: string, password: string) => {
    const { token, user: newUser } = await registerRequest(username, email, password); // Throws on invalid/duplicate data
    storeToken(token); // Persist the session
    setUser(newUser); // Update the UI
  }, []);

  // Log out: forget everything locally (JWTs are stateless, so no server call is needed)
  const logout = useCallback(() => {
    clearToken(); // Remove the token
    setUser(null); // Back to visitor mode
  }, []);

  // useMemo keeps the same object between renders unless something changed (avoids useless re-renders)
  const value = useMemo<AuthContextValue>(
    () => ({ user, isAdmin: user?.role === 'admin', initializing, login, register, logout }), // Context value
    [user, initializing, login, register, logout], // Recompute only when these change
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>; // Make it available to children
}
