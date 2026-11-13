// ============================================================================
// pages/NotFoundPage.tsx
// Shown for any URL that does not match a route.
// ============================================================================

import { Link } from 'react-router-dom'; // Navigation link
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title

export function NotFoundPage() {
  useDocumentTitle('Page not found'); // Tab title
  return (
    <div className="py-20 text-center">
      {/* Big 404 */}
      <p className="text-7xl font-extrabold text-amber-400">404</p>
      {/* Explanation */}
      <h1 className="mt-4 text-2xl font-bold text-white">This scene was cut from the final version.</h1>
      <p className="mt-2 text-slate-400">The page you are looking for does not exist.</p>
      {/* Way back */}
      <Link to="/" className="btn btn-primary mt-8">
        Back to movies
      </Link>
    </div>
  );
}
