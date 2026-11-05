import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    hookTimeout: 60000,
    testTimeout: 30000,
    maxWorkers: 1,
  },
});
