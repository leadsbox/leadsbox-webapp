import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.PLAYWRIGHT_PORT || 4173);
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop-chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
    env: {
      ...process.env,
      VITE_API_BASE: `http://127.0.0.1:${port}/api`,
    },
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
