import { expect, test } from '@playwright/test';

test.describe('Chart click-to-edit', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('single-click on a slice opens the edit modal', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Sport');

    const slice = page.locator('[data-testid^="pie-slice-"]').first();
    await slice.click();
    await expect(page.locator('[data-testid="edit-activity-modal"]')).toBeVisible();
  });

  test('drag of more than 4 px does not open the modal', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    const slice = page.locator('[data-testid^="pie-slice-"]').first();
    const box = await slice.boundingBox();
    if (!box) throw new Error('slice has no bounding box');
    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 20, startY + 20, { steps: 5 });
    await page.mouse.up();

    await expect(page.locator('[data-testid="edit-activity-modal"]')).not.toBeVisible();
  });
});
