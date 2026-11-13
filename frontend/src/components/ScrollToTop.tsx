// ============================================================================
// components/ScrollToTop.tsx
// In an SPA the browser does not scroll back up when the route changes,
// so this component does it manually every time the path changes.
// ============================================================================

import { useEffect } from 'react'; // Side-effect hook
import { useLocation } from 'react-router-dom'; // Current URL

export function ScrollToTop() {
  const { pathname } = useLocation(); // e.g. "/movies/123"

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' }); // Jump to the top of the page (DOM API)
  }, [pathname]); // Only when the path changes (not when ?query params change)

  return null; // Renders nothing visible
}
