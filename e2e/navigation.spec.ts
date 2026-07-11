import { expect, test } from '@playwright/test';

import { mockChatShell } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

test.describe('protected navigation', () => {
  test('redirects anonymous users to auth', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  });

  test('shows conversations and opens a fresh chat for signed in users', async ({ page }) => {
    await signInE2EUser(page.context());
    await mockChatShell(page, [
      {
        id: 11,
        title: 'E2E Saved Chat',
        selectedModel: 'test-model',
        createdAt: '2026-07-10T00:00:00.000Z',
        updatedAt: '2026-07-10T00:00:00.000Z',
      },
    ]);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.locator('aside button').first().click();

    await expect(page.getByText('E2E Saved Chat')).toBeVisible();
    await page.locator('aside button').nth(1).click();

    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByTestId('chat-send-button')).toBeDisabled();
  });
});
