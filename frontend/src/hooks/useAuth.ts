// ============================================================================
// hooks/useAuth.ts
// Custom hook: `const { user, login, logout } = useAuth();`
// ============================================================================

import { useContext } from 'react'; // Reads a context value
import { AuthContext, type AuthContextValue } from '../context/AuthContext'; // The auth context

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext); // Value provided by <AuthProvider>
  if (!context) throw new Error('useAuth() must be used inside <AuthProvider>'); // Developer mistake -> clear message
  return context; // User + actions
}
