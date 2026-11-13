// ============================================================================
// components/RatingBreakdown.tsx
// Horizontal bars showing how many reviews gave 5, 4, 3, 2 and 1 stars.
// ============================================================================

import type { Review } from '../types'; // Review type

export function RatingBreakdown({ reviews }: { reviews: Review[] }) {
  const total = reviews.length; // Number of reviews
  const counts = [5, 4, 3, 2, 1].map((stars) => ({
    stars, // Star value of this row
    count: reviews.filter((review) => review.rating === stars).length, // How many reviews gave it
  }));

  return (
    <ul className="space-y-1.5" aria-label="Rating distribution">
      {counts.map(({ stars, count }) => {
        const percent = total === 0 ? 0 : Math.round((count / total) * 100); // Bar width in %
        return (
          <li key={stars} className="flex items-center gap-2 text-xs text-slate-400">
            {/* Label: "5 ★" */}
            <span className="w-8 shrink-0">{stars} ★</span>
            {/* Bar background + filled part */}
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800">
              <span className="block h-full rounded-full bg-amber-400" style={{ width: `${percent}%` }} />
            </span>
            {/* Count */}
            <span className="w-6 shrink-0 text-right">{count}</span>
          </li>
        );
      })}
    </ul>
  );
}
