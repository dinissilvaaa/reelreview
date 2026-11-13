// ============================================================================
// api/client.ts
// One pre-configured Axios instance used by every API call in the app.
//  - baseURL "/api" (or VITE_API_URL + "/api" when the API is on another domain)
//  - automatically adds "Authorization: Bearer <token>" when logged in
//  - emits an event when the server says the token is no longer valid
// ============================================================================

import axios from 'axios'; // HTTP client

const API_ORIGIN = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, ''); // '' = same origin; trailing "/" removed
export const TOKEN_STORAGE_KEY = 'reelreview_token'; // localStorage key that holds the JWT
export const UNAUTHORIZED_EVENT = 'reelreview:unauthorized'; // Custom DOM event fired on 401 responses

// ---- Token storage helpers (localStorage keeps the user logged in after a refresh) ----
export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_STORAGE_KEY); // null when not logged in
}
export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_STORAGE_KEY, token); // Save after login/register
}
export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY); // Remove on logout
}

// ---- The Axios instance ----
export const api = axios.create({
  baseURL: `${API_ORIGIN}/api`, // Every request path is relative to this, e.g. api.get('/movies')
  timeout: 15_000, // Give up after 15 seconds
});

// Runs BEFORE every request: attach the token if we have one
api.interceptors.request.use((config) => {
  const token = getStoredToken(); // Read the saved JWT
  if (token) config.headers.Authorization = `Bearer ${token}`; // Standard "Bearer" auth header
  return config; // Continue with the (modified) request
});

// Runs AFTER every response: detect expired/invalid sessions
api.interceptors.response.use(
  (response) => response, // Successful responses pass through untouched
  (error: unknown) => {
    const sentToken = axios.isAxiosError(error) && Boolean(error.config?.headers?.Authorization); // Were we logged in?
    if (axios.isAxiosError(error) && error.response?.status === 401 && sentToken) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)); // Tell AuthProvider to log the user out
    }
    return Promise.reject(error); // Let the caller handle the error too
  },
);

/**
 * Turns any error (Axios, network, JS) into a short message for the UI.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: string[] } | undefined; // Our API's error body
    if (data?.errors?.length) return data.errors.join(' • '); // Validation errors from the backend
    if (data?.message) return data.message; // Single error message from the backend
    if (error.code === 'ECONNABORTED') return 'The server took too long to respond. Please try again.'; // Timeout
    if (!error.response) return 'Cannot reach the server. Is the backend running?'; // Network error / server down
  }
  return error instanceof Error ? error.message : 'Something went wrong. Please try again.'; // Fallback
}

/**
 * Builds a full URL for files served by the backend ("/uploads/x.jpg").
 * External URLs (https://...) and blob: previews are returned unchanged.
 */
export function resolveAssetUrl(path: string | undefined | null): string {
  if (!path) return ''; // No image
  return path.startsWith('/') ? `${API_ORIGIN}${path}` : path; // Prefix only server-relative paths
}
