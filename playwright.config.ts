import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:5173' },
  webServer: {
    command: 'pnpm db:migrate && pnpm db:seed && pnpm dev',
    url: 'http://127.0.0.1:5173/api/v1/health',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  reporter: 'list',
});
