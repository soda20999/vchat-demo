import { defineConfig, devices } from '@playwright/test';

const skipWebServer = process.env.PLAYWRIGHT_SKIP_WEB_SERVER === '1';

export default defineConfig({
  testDir: './e2e',
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [['html'], ['github']] : [['html']],
  use: {
    baseURL: 'http://127.0.0.1:3000',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  webServer: skipWebServer ? undefined : {
    command: 'node node_modules/next/dist/bin/next dev --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
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
