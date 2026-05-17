import { expect, test } from '@playwright/test';

test.describe('Chart keyboard interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('every slice is a tab stop', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('A');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('B');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const slices = page.locator('[data-testid^="pie-slice-"]');
    await expect(slices).toHaveCount(2, { timeout: 5000 });
    const firstSlice = slices.first();
    await firstSlice.focus();
    await expect(firstSlice).toBeFocused();
  });

  test('Space opens the edit modal on the focused slice', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    const slice = page.locator('[data-testid^="pie-slice-"]').first();
    await slice.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="edit-activity-modal"]')).toBeVisible();
  });
});
