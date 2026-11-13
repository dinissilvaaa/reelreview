// ============================================================================
// components/Spinner.tsx
// Loading indicator shown while data is being fetched.
// ============================================================================

interface SpinnerProps {
  label?: string; // Text under the spinner
}

export function Spinner({ label = 'Loading...' }: SpinnerProps) {
  return (
    // role="status" tells screen readers that this area announces progress
    <div role="status" className="flex flex-col items-center justify-center gap-3 py-16">
      {/* Spinning circle: a border with one coloured side, rotated by Tailwind's animate-spin */}
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-amber-400" aria-hidden="true" />
      {/* Visible label */}
      <span className="text-sm text-slate-400">{label}</span>
    </div>
  );
}
