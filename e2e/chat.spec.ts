import { expect, test } from '@playwright/test';

import { mockChatShell, mockChatStream, type CapturedChatRequest } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

async function sendChatMessage(page: import('@playwright/test').Page, message: string) {
  const input = page.locator('textarea');
  await expect(page.getByText('test-model')).toBeVisible();
  await input.click();
  await input.pressSequentially(message);
  await expect(page.getByTestId('chat-send-button')).toBeEnabled();
  await page.getByTestId('chat-send-button').click();
}

test.describe('chat main flow', () => {
  test('sends a message and renders the streamed answer', async ({ page }) => {
    const capturedRequests: CapturedChatRequest[] = [];

    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('textarea')).toBeVisible();
    await sendChatMessage(page, 'Hello from Playwright');

    await expect(page.getByText('Hello from Playwright')).toBeVisible();
    await expect(page.getByText('E2E streamed answer')).toBeVisible();
    expect(capturedRequests).toEqual([
      expect.objectContaining({
        content: 'Hello from Playwright',
        model: 'test-model',
        providerName: 'test-provider',
        promptSettings: expect.objectContaining({ templateId: '' }),
        contextOptions: expect.objectContaining({ recentTurns: 8 }),
      }),
    ]);
  });

  test('recovers input state when the chat api fails', async ({ page }) => {
    const capturedRequests: CapturedChatRequest[] = [];

    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests, { status: 500, message: 'E2E chat failed' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await sendChatMessage(page, 'Trigger E2E failure');

    await expect(page.getByText('[Error] E2E chat failed')).toBeVisible();
    await expect(page.locator('textarea')).toBeEditable();
    expect(capturedRequests).toHaveLength(1);
  });
});
