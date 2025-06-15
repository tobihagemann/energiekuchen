import { expect, Page, test } from '@playwright/test';

// Helper function to open delete modal
async function openDeleteModal(page: Page) {
  const headerDeleteButton = page.locator('[data-testid="delete-button"]');
  await expect(headerDeleteButton).toBeVisible({ timeout: 10000 });
  await headerDeleteButton.click();
  await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible({ timeout: 10000 });
}

test.describe('Keyboard Interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should confirm delete all data with Enter key', async ({ page }) => {
    // Add some test data
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Verify activity was added
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Test Activity');

    // Open delete modal
    await openDeleteModal(page);

    // Press Enter to confirm deletion
    await page.keyboard.press('Enter');

    // Verify modal is closed
    await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();

    // Verify all data is deleted
    await expect(page.locator('[data-testid="activity-list-positive"]')).not.toContainText('Test Activity');
  });

  test('should confirm delete activity with Enter key', async ({ page }) => {
    // Add two test activities
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Activity 1');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    await page.locator('[data-testid="quick-add-input-positive"]').fill('Activity 2');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Click delete button for first activity
    const deleteButton = page.locator('[data-testid^="delete-activity-button-"]').first();
    await deleteButton.click();

    // Verify confirmation modal is visible
    await expect(page.locator('[data-testid="activity-delete-confirmation-modal"]')).toBeVisible();

    // Press Enter to confirm deletion
    await page.keyboard.press('Enter');

    // Verify modal is closed
    await expect(page.locator('[data-testid="activity-delete-confirmation-modal"]')).not.toBeVisible();

    // Verify activity is deleted
    await expect(page.locator('[data-testid="activity-list-positive"]')).not.toContainText('Activity 1');

    // Verify second activity still exists
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Activity 2');
  });

  test('should close delete modal with Escape key', async ({ page }) => {
    // Add test data
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Open delete modal
    await openDeleteModal(page);

    // Press Escape to close modal
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();

    // Verify data is NOT deleted
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Test Activity');
  });

  test('should close activity delete confirmation with Escape key', async ({ page }) => {
    // Add test activity
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Click delete button for activity
    const deleteButton = page.locator('[data-testid^="delete-activity-button-"]').first();
    await deleteButton.click();

    // Verify confirmation modal is visible
    await expect(page.locator('[data-testid="activity-delete-confirmation-modal"]')).toBeVisible();

    // Press Escape to close modal
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('[data-testid="activity-delete-confirmation-modal"]')).not.toBeVisible();

    // Verify activity is NOT deleted
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Test Activity');
  });
});
