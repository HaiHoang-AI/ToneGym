import { defineConfig, devices } from '@playwright/test';

// Browsers are installed on drive D (see `npm run e2e:install`), not in the user profile.
process.env.PLAYWRIGHT_BROWSERS_PATH ??= 'D:/ms-playwright';

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: false,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5173',
    ...devices['Desktop Chrome'],
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
