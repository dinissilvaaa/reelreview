// ============================================================================
// test/setup.ts
// Runs before every frontend test file (configured in vite.config.ts).
// ============================================================================

import '@testing-library/jest-dom/vitest'; // Adds DOM matchers such as toBeInTheDocument()
import { afterEach } from 'vitest'; // Test lifecycle hook
import { cleanup } from '@testing-library/react'; // Unmounts rendered components

afterEach(() => {
  cleanup(); // Remove everything rendered by the previous test (tests stay independent)
});
