import { expect, test } from '@playwright/test';

test.describe('/auth', () => {
  async function switchToRegister(page: import('@playwright/test').Page) {
    // 当前页面的登录/注册 tab 没有稳定 testid，这里只在 tab 区域用最小 nth 定位注册按钮。
    await page
      .locator('button[type="button"]')
      .filter({ has: page.locator('text=/./') })
      .nth(1)
      .click();
  }

  test('opens the auth page with the login form ready', async ({ page }) => {
    // 验证默认进入 /auth 时，登录表单和提交按钮已经可以使用。
    await page.goto('/auth');

    await expect(page).toHaveURL(/\/auth$/);
    await expect(page.getByText('vchat')).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible();
    await expect(page.locator('form button[type="submit"]')).toBeEnabled();
  });

  test('switches to register and shows client-side validation', async ({ page }) => {
    await page.goto('/auth');

    // 切到注册模式后空提交，应由前端校验直接展示错误提示，不需要请求后端。
    await switchToRegister(page);
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="new-password"]')).toBeVisible();

    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form + div p')).toBeVisible();
  });

  test('shows the login api error message', async ({ page }) => {
    // mock 登录接口失败，确认服务端错误会展示给用户。
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'E2E login failed' }),
      });
    });

    await page.goto('/auth');
    await page.locator('input[autocomplete="email"]').fill('e2e@example.com');
    await page.locator('input[autocomplete="current-password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText('E2E login failed')).toBeVisible();
  });

  test('shows the register api error message', async ({ page }) => {
    // mock 注册接口失败，确认注册页也能正确展示接口错误。
    await page.route('**/api/auth/register', async (route) => {
      await route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'E2E register failed' }),
      });
    });

    await page.goto('/auth');
    await switchToRegister(page);
    await page.locator('input[autocomplete="username"]').fill('e2e-user');
    await page.locator('input[autocomplete="email"]').fill('e2e@example.com');
    await page.locator('input[autocomplete="new-password"]').fill('password123');
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByText('E2E register failed')).toBeVisible();
  });
});
