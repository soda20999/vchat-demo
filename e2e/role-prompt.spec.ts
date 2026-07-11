import { expect, test } from '@playwright/test';

import { mockChatShell, mockChatStream, type CapturedChatRequest } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

async function sendChatMessage(page: import('@playwright/test').Page, message: string) {
  const input = page.locator('textarea');
  await input.click();
  await input.pressSequentially(message);
  await expect(page.getByTestId('chat-send-button')).toBeEnabled();
  await page.getByTestId('chat-send-button').click();
}

async function openRoleMenu(page: import('@playwright/test').Page) {
  await roleButtons(page).first().click();
}

function roleButtons(page: import('@playwright/test').Page) {
  return page.locator('textarea').locator('xpath=..').locator('button');
}

test.describe('role and prompt flow', () => {
  test('sends the selected role template id and can reset to default role', async ({ page }) => {
    const capturedRequests: CapturedChatRequest[] = [];

    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await openRoleMenu(page);
    await roleButtons(page).nth(3).click();
    await sendChatMessage(page, 'Role prompt E2E message');

    await expect(page.getByText('E2E streamed answer')).toBeVisible();
    expect(capturedRequests[0]).toEqual(
      expect.objectContaining({
        promptSettings: expect.objectContaining({ templateId: 'role-study' }),
      }),
    );

    await openRoleMenu(page);
    await roleButtons(page).nth(3).click();
    await sendChatMessage(page, 'Default prompt E2E message');

    await expect(page.getByText('Default prompt E2E message')).toBeVisible();
    expect(capturedRequests[1]).toEqual(
      expect.objectContaining({
        promptSettings: expect.objectContaining({ templateId: '' }),
      }),
    );
  });
});
