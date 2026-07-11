import { expect, test } from '@playwright/test';

import { mockChatShell } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

test.describe('protected navigation', () => {
  async function expandSidebar(page: import('@playwright/test').Page) {
    const toggle = page.getByTestId('sidebar-toggle');

    // Next 页面刚完成 domcontentloaded 时，客户端事件可能还在 hydration。
    // 这里重复点击直到 aria-expanded 真的变为 true，避免第一次点击被忽略。
    await expect
      .poll(
        async () => {
          await toggle.click();
          try {
            await expect(toggle).toHaveAttribute('aria-expanded', 'true', { timeout: 1000 });
            return true;
          } catch {
            return false;
          }
        },
        { timeout: 10000 },
      )
      .toBe(true);
  }

  test('redirects anonymous users to auth', async ({ page }) => {
    // 未登录用户访问受保护首页时，代理层应该把用户带到登录页。
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  });

  test('shows conversations and opens a fresh chat for signed in users', async ({ page }) => {
    // 通过测试 JWT cookie 模拟已登录状态，避免 E2E 依赖真实账号和数据库。
    await signInE2EUser(page.context());

    // mock 会话列表和模型列表，让导航测试只关注侧边栏和新会话入口。
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

    // 使用稳定 testid 展开侧边栏，不再依赖 aside 内按钮顺序。
    await expandSidebar(page);

    await expect(page.getByTestId('conversation-item-11')).toBeVisible();

    // 点击新建会话入口后，页面应回到空白聊天输入状态。
    await page.getByTestId('new-conversation-button').click();

    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.getByTestId('chat-send-button')).toBeDisabled();
  });
});
