import { expect, test } from '@playwright/test';

test.describe('/auth', () => {
  async function switchToRegister(page: import('@playwright/test').Page) {
    await page.locator('button[type="button"]').filter({ has: page.locator('text=/./') }).nth(1).click();
  }

  test('opens the auth page with the login form ready', async ({ page }) => {
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

    await switchToRegister(page);
    await expect(page.locator('input[autocomplete="username"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="new-password"]')).toBeVisible();

    await page.locator('form button[type="submit"]').click();
    await expect(page.locator('form + div p')).toBeVisible();
  });

  test('shows the login api error message', async ({ page }) => {
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
