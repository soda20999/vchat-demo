import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev --hostname localhost',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    stderr: 'ignore',
    stdout: 'ignore',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
