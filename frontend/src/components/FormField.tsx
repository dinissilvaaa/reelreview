// ============================================================================
// components/FormField.tsx
// Label + input (passed as children) + error message, with consistent
// spacing. Keeps the forms short and readable.
// ============================================================================

import type { ReactNode } from 'react'; // Type for any renderable content

interface FormFieldProps {
  id: string; // id of the input inside (links the <label> to it)
  label: string; // Label text
  error?: string; // Validation message (shown in red)
  hint?: string; // Help text (shown when there is no error)
  children: ReactNode; // The actual <input>, <textarea> or <select>
}

export function FormField({ id, label, error, hint, children }: FormFieldProps) {
  return (
    <div>
      {/* Clicking the label focuses the input with the same id */}
      <label htmlFor={id} className="label">
        {label}
      </label>
      {children}
      {/* Error has priority over the hint. The id lets inputs reference it with aria-describedby */}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
