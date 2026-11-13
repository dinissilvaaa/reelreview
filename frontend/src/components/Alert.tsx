// ============================================================================
// components/Alert.tsx
// Coloured message box for errors, successes and information.
// ============================================================================

import type { ReactNode } from 'react'; // Type for any renderable content

type AlertType = 'error' | 'success' | 'info'; // Visual variants

interface AlertProps {
  type?: AlertType; // Variant (default: info)
  children: ReactNode; // Message
  onClose?: () => void; // Optional "x" button handler
}

// Tailwind classes for each variant
const STYLES: Record<AlertType, string> = {
  error: 'border-red-500/40 bg-red-500/10 text-red-200', // Red
  success: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200', // Green
  info: 'border-sky-500/40 bg-sky-500/10 text-sky-200', // Blue
};

export function Alert({ type = 'info', children, onClose }: AlertProps) {
  return (
    // role="alert" makes screen readers read errors immediately; "status" is polite for the others
    <div role={type === 'error' ? 'alert' : 'status'} className={`flex items-start justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${STYLES[type]}`}>
      {/* Message */}
      <div>{children}</div>
      {/* Close button (only when a handler is given) */}
      {onClose && (
        <button type="button" onClick={onClose} className="shrink-0 opacity-70 hover:opacity-100" aria-label="Dismiss message">
          ✕
        </button>
      )}
    </div>
  );
}
