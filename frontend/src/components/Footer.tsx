// ============================================================================
// components/Footer.tsx
// Simple page footer.
// ============================================================================

const YEAR = new Date().getFullYear(); // Current year, computed once when the module loads (keeps rendering pure)

export function Footer() {
  return (
    <footer className="border-t border-slate-800 py-6 text-center text-sm text-slate-500">
      {/* Copyright + stack */}
      <p>
        © {YEAR} ReelReview · Built with React, Express, MongoDB &amp; TypeScript
      </p>
    </footer>
  );
}
