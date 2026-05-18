import { expect, test } from '@playwright/test';

test.describe('Single-activity chart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('renders a full circle and emits no boundary handles', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Solo');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const slices = page.locator('[data-testid^="pie-slice-"]');
    const currentChart = page.locator('[data-testid="current-state-section"]');
    await expect(currentChart.locator('[data-testid^="pie-slice-"]')).toHaveCount(1);

    // No boundary handles for the single-activity case.
    await expect(currentChart.locator('[data-testid^="pie-boundary-handle-"]')).toHaveCount(0);

    // Click on the single slice should still open the edit modal.
    await slices.first().click();
    await expect(page.locator('[data-testid="edit-activity-modal"]')).toBeVisible();
  });
});
