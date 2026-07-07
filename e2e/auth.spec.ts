import { expect, test } from '@playwright/test';

test.describe('/auth', () => {
  test('opens the auth page with login and register options', async ({ page }) => {
    await page.goto('/auth');

    await expect(page.getByText('vchat')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: '注册' }).first()).toBeVisible();
  });

  test('switches to register and shows client-side validation', async ({ page }) => {
    await page.goto('/auth');

    await page.getByRole('button', { name: '注册' }).first().click();
    await expect(page.getByPlaceholder('请输入用户名')).toBeVisible();

    await page.locator('form').getByRole('button', { name: '注册' }).click();
    await expect(page.getByText('用户名至少需要 2 个字符')).toBeVisible();
  });
});
