import { defineConfig, devices } from '@playwright/test';

// webServer entries reuse whatever the developer already has running
// (reuseExistingServer) so this doesn't fight a dev session already on
// these ports, but will boot all three from a cold CI checkout too.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['json', { outputFile: 'test-results/playwright-results.json' }]] : 'list',
  timeout: 30_000,
  // Several specs wait on a real fetch to the dev backend (not mocked) -
  // under parallel workers all hitting the same dev servers at once, that
  // can occasionally take longer than the 5s auto-retry default.
  expect: { timeout: 10_000 },
  use: {
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'admin-setup',
      testMatch: /auth\.setup\.js/,
      use: { baseURL: 'http://localhost:5175' },
    },
    {
      name: 'client',
      testDir: './e2e/client',
      use: { ...devices['Desktop Chrome'], baseURL: 'http://localhost:5173' },
    },
    {
      name: 'admin',
      testDir: './e2e/admin',
      testIgnore: /auth\.setup\.js/,
      dependencies: ['admin-setup'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'http://localhost:5175',
        storageState: './e2e/.auth/admin.json',
      },
    },
  ],
  webServer: [
    {
      command: 'npm run dev',
      cwd: './server',
      url: 'http://localhost:5000/api/health',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: './client',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'npm run dev',
      cwd: './admin',
      url: 'http://localhost:5175',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
});
