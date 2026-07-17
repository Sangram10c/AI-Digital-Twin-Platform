import { test, expect } from '@playwright/test';

test.describe('smoke', () => {
  test('home page responds', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.ok()).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });
});
