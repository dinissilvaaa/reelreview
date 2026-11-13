// ============================================================================
// vite-env.d.ts
// Tells TypeScript which VITE_* environment variables exist and their types.
// ============================================================================

interface ImportMetaEnv {
  readonly VITE_API_URL?: string; // Optional absolute URL of the backend (empty = same origin)
}

interface ImportMeta {
  readonly env: ImportMetaEnv; // import.meta.env is typed with the interface above
}
