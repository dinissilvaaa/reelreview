// ============================================================================
// pages/LoginPage.tsx
// Login form with client-side validation and server error feedback.
// After logging in, the user returns to the page they were trying to open.
// ============================================================================

import { useState, type ChangeEvent, type FormEvent } from 'react'; // React hooks + event types
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'; // Navigation
import { useAuth } from '../hooks/useAuth'; // login()
import { useDocumentTitle } from '../hooks/useDocumentTitle'; // Tab title
import { getErrorMessage } from '../api/client'; // Error -> text
import { FormField } from '../components/FormField'; // Label + input + error
import { Alert } from '../components/Alert'; // Message box
import { hasErrors, validateLogin, type FieldErrors, type LoginValues } from '../utils/validation'; // Validation

export function LoginPage() {
  useDocumentTitle('Log in'); // Tab title
  const { user, login } = useAuth(); // Auth state + action
  const navigate = useNavigate(); // Redirect after login
  const location = useLocation(); // Contains `state.from` set by ProtectedRoute
  const from = (location.state as { from?: string } | null)?.from ?? '/'; // Where to go after login

  const [values, setValues] = useState<LoginValues>({ email: '', password: '' }); // Form values
  const [errors, setErrors] = useState<FieldErrors<LoginValues>>({}); // Field errors
  const [serverError, setServerError] = useState(''); // API error
  const [submitting, setSubmitting] = useState(false); // Request in progress?

  if (user) return <Navigate to={from} replace />; // Already logged in -> leave this page

  // One handler for every input: uses the input's "name" attribute as the key
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target; // Which field and its new value
    setValues((previous) => ({ ...previous, [name]: value })); // Copy the old values and replace one
    setErrors((previous) => ({ ...previous, [name]: undefined })); // The user is fixing it -> hide its old error
  };

  // Submit: validate -> call the API -> redirect or show the error
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // No page reload
    const validation = validateLogin(values); // Client-side checks
    setErrors(validation); // Show/clear field errors
    if (hasErrors(validation)) return; // Stop if invalid

    setSubmitting(true); // Disable the button
    setServerError(''); // Clear old errors
    try {
      await login(values.email.trim(), values.password); // POST /api/auth/login
      navigate(from, { replace: true }); // Go back to where the user came from
    } catch (error) {
      setServerError(getErrorMessage(error)); // e.g. "Invalid email or password"
    } finally {
      setSubmitting(false); // Re-enable the button
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <form onSubmit={handleSubmit} className="card space-y-5" noValidate>
        {/* Heading */}
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-400">Log in to rate and review movies.</p>
        </div>

        {/* API error */}
        {serverError && <Alert type="error">{serverError}</Alert>}

        {/* Email */}
        <FormField id="email" label="Email" error={errors.email}>
          <input
            id="email" // Matches the label
            name="email" // Key used by handleChange
            type="email" // Email keyboard on phones
            autoComplete="email" // Let the browser autofill it
            value={values.email} // Controlled input
            onChange={handleChange} // Update state
            aria-invalid={Boolean(errors.email)} // Screen readers announce invalid fields
            aria-describedby={errors.email ? 'email-error' : undefined} // Link to the error text
            className={`input ${errors.email ? 'input-error' : ''}`}
          />
        </FormField>

        {/* Password */}
        <FormField id="password" label="Password" error={errors.password}>
          <input
            id="password"
            name="password"
            type="password" // Hides the characters
            autoComplete="current-password" // Password managers
            value={values.password}
            onChange={handleChange}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'password-error' : undefined}
            className={`input ${errors.password ? 'input-error' : ''}`}
          />
        </FormField>

        {/* Submit */}
        <button type="submit" className="btn btn-primary w-full" disabled={submitting}>
          {submitting ? 'Logging in...' : 'Log in'}
        </button>

        {/* Link to register */}
        <p className="text-center text-sm text-slate-400">
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-amber-300 hover:underline">
            Create one
          </Link>
        </p>

        {/* Demo credentials (seeded by the backend) */}
        <p className="rounded-lg bg-slate-800/60 p-3 text-xs text-slate-400">
          Demo account: <code className="text-slate-200">demo@reelreview.com</code> / <code className="text-slate-200">Demo1234!</code>
        </p>
      </form>
    </div>
  );
}
