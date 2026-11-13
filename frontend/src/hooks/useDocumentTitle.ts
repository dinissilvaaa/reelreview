// ============================================================================
// hooks/useDocumentTitle.ts
// Updates the browser tab title (direct DOM manipulation via document.title).
// ============================================================================

import { useEffect } from 'react'; // Side-effect hook

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    document.title = title ? `${title} · ReelReview` : 'ReelReview'; // e.g. "Inception · ReelReview"
  }, [title]); // Run again whenever the title changes
}
