import { test, expect } from '@playwright/test';

test.describe('SocialMock Smoke Tests', () => {
  test('app loads and shows dashboard', async ({ page }) => {
    await page.goto('/');
    // Should see the SocialMock title or logo
    await expect(page.locator('text=SocialMock').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows create new file button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Create new file').first()).toBeVisible({ timeout: 10000 });
  });

  test('dashboard shows templates section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('text=Templates').first()).toBeVisible({ timeout: 10000 });
  });

  test('can create new project and see editor', async ({ page }) => {
    await page.goto('/');
    // Click "Create new file"
    const createBtn = page.locator('text=Create new file').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Should transition to editor view - look for the Design/Animate tabs or canvas
    await expect(page.locator('text=Design').first()).toBeVisible({ timeout: 10000 });
  });

  test('can click a template and see editor', async ({ page }) => {
    await page.goto('/');
    // Click Templates tab
    const templatesTab = page.locator('text=Templates').first();
    await expect(templatesTab).toBeVisible({ timeout: 10000 });
    await templatesTab.click();

    // Click first template
    const firstTemplate = page.locator('[data-testid="template-card"]').first();
    // If data-testid not found, try clicking by text
    try {
      await firstTemplate.click({ timeout: 3000 });
    } catch {
      // Fallback: click first template-like element
      const templateButtons = page.locator('button:has-text("Use Template"), button:has-text("White Social")');
      if (await templateButtons.first().isVisible()) {
        await templateButtons.first().click();
      }
    }

    // Should see editor elements
    await expect(page.locator('text=Design').first()).toBeVisible({ timeout: 10000 });
  });

  test('editor has timeline dock', async ({ page }) => {
    await page.goto('/');
    // Create new file first
    const createBtn = page.locator('text=Create new file').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Look for timeline elements
    await expect(page.locator('text=Timeline').first()).toBeVisible({ timeout: 10000 });
  });

  test('editor shows platform options', async ({ page }) => {
    await page.goto('/');
    const createBtn = page.locator('text=Create new file').first();
    await expect(createBtn).toBeVisible({ timeout: 10000 });
    await createBtn.click();

    // Should show platform icon/button (Twitter/X is default)
    // Look for the platform selector area
    await expect(page.locator('text=X / Twitter').first()).toBeVisible({ timeout: 10000 });
  });
});
