import { expect, test } from '@playwright/test';

import { mockChatShell, mockChatStream, type CapturedChatRequest } from './helpers/api-mocks';
import { signInE2EUser } from './helpers/auth';

async function sendChatMessage(page: import('@playwright/test').Page, message: string) {
  // 模拟真实用户输入：先聚焦输入框，再逐字输入，最后等待发送按钮变为可点击。
  const input = page.locator('textarea');
  await input.click();
  await input.pressSequentially(message);
  await expect(page.getByTestId('chat-send-button')).toBeEnabled();
  await page.getByTestId('chat-send-button').click();
}

async function openRoleMenuAndWait(page: import('@playwright/test').Page, optionTestId: string) {
  // 先等角色入口可见，确保聊天输入区已经完成客户端初始化。
  const trigger = page.getByTestId('role-menu-trigger');
  await expect(trigger).toBeVisible();
  await expect(trigger).toBeEnabled();

  // 菜单是客户端条件渲染的；如果首次点击发生在 hydration 前，React 可能不会处理。
  // 因此这里重复点击直到目标角色按钮真正出现，而不是依赖固定等待时间。
  await expect
    .poll(
      async () => {
        await trigger.click();
        try {
          await expect(page.getByTestId(optionTestId)).toBeVisible({ timeout: 1000 });
          return true;
        } catch {
          return false;
        }
      },
      { timeout: 10000 },
    )
    .toBe(true);
}

test.describe('role and prompt flow', () => {
  test('sends the selected role template id and can reset to default role', async ({ page }) => {
    const capturedRequests: CapturedChatRequest[] = [];

    // E2E 只验证前端角色选择是否进入 /api/chat 请求体，不依赖真实后端服务。
    await signInE2EUser(page.context());
    await mockChatShell(page);
    await mockChatStream(page, capturedRequests);

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // 使用稳定 testid 打开角色菜单并选择学习角色，避免依赖按钮顺序和中文 label。
    await openRoleMenuAndWait(page, 'role-option-role-study');
    await page.getByTestId('role-option-role-study').click();
    await sendChatMessage(page, 'Role prompt E2E message');

    await expect(page.getByText('E2E streamed answer')).toBeVisible();
    // 角色选择的核心验收点：请求体必须带上对应 prompt 模板 id。
    expect(capturedRequests[0]).toEqual(
      expect.objectContaining({
        promptSettings: expect.objectContaining({ templateId: 'role-study' }),
      }),
    );

    // 再次打开菜单并点击当前选中角色，组件会重置为默认角色。
    await openRoleMenuAndWait(page, 'role-option-default');
    await page.getByTestId('role-option-default').click();
    await sendChatMessage(page, 'Default prompt E2E message');

    // 重置后再次发送，templateId 应回到空字符串，证明默认角色生效。
    expect(capturedRequests[1]).toEqual(
      expect.objectContaining({
        promptSettings: expect.objectContaining({ templateId: '' }),
      }),
    );
  });
});
