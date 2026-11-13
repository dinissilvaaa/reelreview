// ============================================================================
// pages/RegisterPage.tsx
// Sign-up form. On success the user is logged in automatically.
// ============================================================================

import { useState, type ChangeEvent, type FormEvent } from 'react'; // React hooks + event types
import { Link, Navigate, useNavigate } from 'react-router-dom'; // Navigation
import { useAuth } from '../hooks/useAuth'; // register()
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { getErrorMessage } from '../api/client'; // Error -> text
import { FormField } from '../components/FormField'; // Label + input + error
import { Alert } from '../components/Alert'; // Message box
import { hasErrors, validateRegister, type FieldErrors, type RegisterValues } from '../utils/validation'; // Validation

// Field definitions, so the four inputs can be rendered with one .map()
const FIELDS: { name: keyof RegisterValues; label: string; type: string; autoComplete: string; hint?: string }[] = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username', hint: 'Shown next to your reviews' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'password', label: 'Password', type: 'password', autoComplete: 'new-password', hint: 'At least 8 characters with a letter and a number' },
  { name: 'confirmPassword', label: 'Confirm password', type: 'password', autoComplete: 'new-password' },
];

export function RegisterPage() {
  useDocumentTitle('Sign up'); // Tab title
  const { user, register } = useAuth(); // Auth state + action
  const navigate = useNavigate(); // Redirect after sign-up

  const [values, setValues] = useState<RegisterValues>({ username: '', email: '', password: '', confirmPassword: '' }); // Form values
  const [errors, setErrors] = useState<FieldErrors<RegisterValues>>({}); // Field errors
  const [serverError, setServerError] = useState(''); // API error
  const [submitting, setSubmitting] = useState(false); // Request in progress?

  if (user) return <Navigate to="/" replace />; // Already logged in -> go home

  // Shared input handler (uses the "name" attribute)
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target; // Field + value
    setValues((previous) => ({ ...previous, [name]: value })); // Update one field
    setErrors((previous) => ({ ...previous, [name]: undefined })); // The user is fixing it -> hide its old error
  };

  // Submit: validate -> register -> go home
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // No page reload
    const validation = validateRegister(values); // Client-side checks
    setErrors(validation); // Show/clear errors
    if (hasErrors(validation)) return; // Stop if invalid

    setSubmitting(true); // Disable the button
    setServerError(''); // Clear old errors
    try {
      await register(values.username.trim(), values.email.trim(), values.password); // POST /api/auth/register
      navigate('/', { replace: true }); // Logged in -> home page
    } catch (error) {
      setServerError(getErrorMessage(error)); // e.g. "This email is already registered"
    } finally {
      setSubmitting(false); // Re-enable the button
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white">Create your account</h1>
          <p className="mt-1 text-sm text-slate-400">Join ReelReview and start rating movies.</p>
        </div>

        {/* API error */}
        {serverError && <Alert type="error">{serverError}</Alert>}

        {/* The four fields */}
        {FIELDS.map((field) => (
          <FormField key={field.name} id={field.name} label={field.label} error={errors[field.name]} hint={field.hint}>
            <input
              id={field.name} // Matches the label
              name={field.name} // Key used by handleChange
              type={field.type} // text / email / password
              autoComplete={field.autoComplete} // Browser autofill hint
              value={values[field.name]} // Controlled input
              onChange={handleChange} // Update state
              aria-invalid={Boolean(errors[field.name])} // Accessibility
              aria-describedby={errors[field.name] ? `${field.name}-error` : undefined} // Link to the error text
              className={`input ${errors[field.name] ? 'input-error' : ''}`}
            />
          </FormField>
        ))}

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating account...' : 'Sign up'}
        </button>

        {/* Link to login */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-amber-300 hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
