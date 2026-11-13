// ----------------------------------------------------------------------------
// vitest.config.mts - configuration for the backend automated tests.
// The .mts extension forces this file to be loaded as an ES module.
// ----------------------------------------------------------------------------
import { defineConfig } from 'vitest/config'; // Helper that gives us autocompletion for the options

export default defineConfig({
  test: {
    environment: 'node', // Run tests in a plain Node.js environment (no browser APIs)
    include: ['tests/**/*.test.ts'], // Only files ending in .test.ts inside /tests are tests
    hookTimeout: 180_000, // The first run downloads an in-memory MongoDB binary, which can take a while
    testTimeout: 30_000, // Maximum time for a single test
    fileParallelism: false, // Run test files one at a time (each starts its own MongoDB instance)
  },
});
