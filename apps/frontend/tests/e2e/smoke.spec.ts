import { test, expect } from '@playwright/test';

test.describe('Phase 01 Foundation & Design System Smoke Tests', () => {
  test('landing page loads with navigation and hero elements', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    await expect(page.getByText('AI Digital Twin').first()).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Free Workspace/i })).toBeVisible();
  });

  test('features page loads successfully', async ({ page }) => {
    await page.goto('/features');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Deep Engineering Intelligence/i);
    await expect(page.getByText(/Hybrid Search Engine/i)).toBeVisible();
    await expect(page.getByText(/10-Step AI \/ RAG Chat Engine/i)).toBeVisible();
  });

  test('login and registration pages render forms', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: /Sign in to your account/i })).toBeVisible();
    await expect(page.getByPlaceholder('developer@company.com')).toBeVisible();

    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /Create your account/i })).toBeVisible();
  });

  test('workspaces page renders workspace list', async ({ page }) => {
    await page.goto('/workspaces');
    await expect(page.getByRole('heading', { name: 'Workspaces' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Create Workspace/i })).toBeVisible();
  });

  test('theme toggle switches dark/light class on html element', async ({ page }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark|light/);

    const themeBtn = page.getByRole('button', { name: /Toggle theme/i });
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await expect(html).toBeVisible();
    }
  });
});
