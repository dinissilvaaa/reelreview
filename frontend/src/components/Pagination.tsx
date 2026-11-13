// ============================================================================
// components/Pagination.tsx
// "Previous / Page X of Y / Next" controls.
// ============================================================================

interface PaginationProps {
  page: number; // Current page (1-based)
  totalPages: number; // Number of pages
  onPageChange: (page: number) => void; // Called with the new page number
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null; // Nothing to paginate -> render nothing

  return (
    <nav className="flex items-center justify-center gap-3 pt-6" aria-label="Pagination">
      {/* Previous page (disabled on the first page) */}
      <button type="button" className="btn btn-secondary" onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        ← Previous
      </button>
      {/* Position indicator */}
      <span className="text-sm text-slate-400" aria-current="page">
        Page <strong className="text-white">{page}</strong> of {totalPages}
      </span>
      {/* Next page (disabled on the last page) */}
      <button type="button" className="btn btn-secondary" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>
        Next →
      </button>
    </nav>
  );
}
