import { expect, test } from '@playwright/test';

test.describe('Chart boundary drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('boundary handle is rendered when chart has 2+ activities', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('A');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('B');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const handles = page.locator('[data-testid^="pie-boundary-handle-"]');
    await expect(handles.first()).toBeAttached({ timeout: 5000 });
  });
});
