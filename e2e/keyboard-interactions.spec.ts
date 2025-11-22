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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Verify activity was added
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Test Activity');

    // Open delete modal
    await openDeleteModal(page);

    // Press Enter to confirm deletion
    await page.keyboard.press('Enter');

    // Verify modal is closed
    await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();

    // Verify all data is deleted
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Test Activity');
  });

  test('should confirm delete activity with Enter key', async ({ page }) => {
    // Add two test activities
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Activity 1');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Activity 2');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

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
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Activity 1');

    // Verify second activity still exists
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Activity 2');
  });

  test('should close delete modal with Escape key', async ({ page }) => {
    // Add test data
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Open delete modal
    await openDeleteModal(page);

    // Press Escape to close modal
    await page.keyboard.press('Escape');

    // Verify modal is closed
    await expect(page.locator('[data-testid="delete-modal"]')).not.toBeVisible();

    // Verify data is NOT deleted
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Test Activity');
  });

  test('should close activity delete confirmation with Escape key', async ({ page }) => {
    // Add test activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

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
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Test Activity');
  });

  test('should cancel edit activity with Escape key when focus is in edit form', async ({ page }) => {
    // Add test activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Original Name');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Wait for activity to be visible
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    await expect(activityItem).toBeVisible();

    // Get the activity ID
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';

    // Click edit button for activity
    const editButton = page.locator(`[data-testid="edit-activity-button-${id}"]`);
    await expect(editButton).toBeVisible();
    await editButton.click();

    // Verify edit modal is visible
    const editModal = page.locator('[data-testid="edit-activity-modal"]');
    await expect(editModal).toBeVisible();

    // Focus on the input field and change the name
    const nameInput = editModal.locator('[data-testid="activity-name-input"]');
    await nameInput.focus();
    await nameInput.clear();
    await nameInput.fill('Changed Name');

    // Press Escape to cancel editing
    await page.keyboard.press('Escape');

    // Verify edit modal is closed
    await expect(editModal).not.toBeVisible();

    // Verify activity still has original name
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Original Name');
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Changed Name');
  });
});
