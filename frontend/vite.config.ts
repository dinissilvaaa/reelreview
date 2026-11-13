/// <reference types="vitest/config" />
// ----------------------------------------------------------------------------
// vite.config.ts - configuration for the Vite dev server, the production
// build and the Vitest test runner.
// ----------------------------------------------------------------------------
import { defineConfig, loadEnv } from 'vite'; // defineConfig = autocompletion, loadEnv = read .env files
import react from '@vitejs/plugin-react'; // React support (JSX, Fast Refresh)
import tailwindcss from '@tailwindcss/vite'; // Tailwind CSS v4 integration

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), ''); // Read .env / .env.[mode] (Vite does not do this for the config file itself)
  const apiTarget = env.VITE_PROXY_TARGET || 'http://localhost:5000'; // Where the backend runs during development

  // The frontend calls relative URLs like "/api/movies". In development, Vite forwards
  // (proxies) them to the backend, so there are no CORS problems and no hard-coded URLs.
  const proxy = {
    '/api': apiTarget, // REST API requests
    '/uploads': apiTarget, // Uploaded poster images
  };

  return {
    plugins: [react(), tailwindcss()], // Enable React and Tailwind
    server: { port: 5173, proxy }, // `npm run dev`     -> http://localhost:5173
    preview: { port: 4173, proxy }, // `npm run preview` -> http://localhost:4173 (serves the production build)
    test: {
      environment: 'jsdom', // Simulate a browser (DOM) inside Node.js for component tests
      setupFiles: ['./src/test/setup.ts'], // Runs before every test file (adds DOM matchers)
      css: false, // Tests do not need to process CSS
    },
  };
});
