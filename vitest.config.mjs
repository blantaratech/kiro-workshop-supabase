import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.mjs'],
    testTimeout: 30000,
    hookTimeout: 30000,
    maxWorkers: 1,
    coverage: {
      provider: 'v8',
      include: ['frontend/src/lib/config.ts', 'frontend/src/lib/domain.ts'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
