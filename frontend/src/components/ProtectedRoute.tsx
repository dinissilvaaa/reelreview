// ============================================================================
// components/ProtectedRoute.tsx
// Wraps pages that need a logged-in user (and optionally an admin).
//   <ProtectedRoute><MyReviewsPage /></ProtectedRoute>
//   <ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>
// The backend checks permissions again: this only improves the UX.
// ============================================================================

import type { ReactNode } from 'react'; // Type for any renderable content
import { Navigate, useLocation } from 'react-router-dom'; // Redirect component + current URL
import { useAuth } from '../hooks/useAuth'; // Auth state
import { Spinner } from './Spinner'; // Loading indicator
import { Alert } from './Alert'; // Message box

interface ProtectedRouteProps {
  children: ReactNode; // The protected page
  adminOnly?: boolean; // Also require the admin role
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isAdmin, initializing } = useAuth(); // Auth state
  const location = useLocation(); // Where the user wanted to go

  if (initializing) return <Spinner label="Checking your session..." />; // Wait for the saved session check

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />; // Not logged in -> login, then come back here
  }

  if (adminOnly && !isAdmin) {
    return <Alert type="error">Access denied: this page is only available to administrators.</Alert>; // Logged in but not admin
  }

  return children; // Allowed -> render the page
}
