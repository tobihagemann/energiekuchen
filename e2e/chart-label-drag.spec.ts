import { expect, test } from '@playwright/test';

test.describe('Chart labels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('labels render at slice centroids by default', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    const label = page.locator('[data-testid^="pie-label-"]').first();
    await expect(label).toBeVisible();
    await expect(label).toContainText('Sport');
  });
});
