import { expect, test } from '@playwright/test';

import { mockChatShell, mockChatStream, type CapturedChatRequest } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

async function sendChatMessage(page: import('@playwright/test').Page, message: string) {
  // 等模型初始化完成后再输入，避免页面刚 hydrate 时按钮仍处于不可发送状态。
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

    // 通过 cookie 模拟登录，并 mock 聊天页启动所需的会话、模型和 SSE 接口。
    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('textarea')).toBeVisible();
    await sendChatMessage(page, 'Hello from Playwright');

    await expect(page.getByText('Hello from Playwright')).toBeVisible();
    await expect(page.getByText('E2E streamed answer')).toBeVisible();

    // 除了看页面结果，还要确认发送给后端的核心字段没有丢。
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

    // 这里故意让 /api/chat 返回 500，验证前端能展示错误并恢复输入能力。
    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests, { status: 500, message: 'E2E chat failed' });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await sendChatMessage(page, 'Trigger E2E failure');

    await expect(page.getByText(/AI response interrupted|E2E chat failed/)).toBeVisible();
    await expect(page.locator('textarea')).toBeEditable();
    expect(capturedRequests).toHaveLength(1);
  });
});
