import { expect, test } from '@playwright/test';

test.describe('Activity Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should display empty state when no activities exist', async ({ page }) => {
    // Should show empty state messages
    await expect(page.locator('[data-testid="empty-activities-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-desired"]')).toBeVisible();
  });

  test('should create a current state activity', async ({ page }) => {
    // Type activity name in the quick add input
    await page.locator('[data-testid="quick-add-input-current"]').fill('Yoga');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Yoga');
  });

  test('should create a desired state activity', async ({ page }) => {
    // Type activity name in the quick add input
    await page.locator('[data-testid="quick-add-input-desired"]').fill('Work Stress');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Work Stress');
  });

  test('should create multiple activities in both states', async ({ page }) => {
    // Add a current state activity
    await page.locator('[data-testid="quick-add-input-current"]').fill('Morning Exercise');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Add a desired state activity
    await page.locator('[data-testid="quick-add-input-desired"]').fill('Late Night Work');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Verify both activities are visible
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Morning Exercise');
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Late Night Work');

    // Empty state should no longer be visible for lists with activities
    await expect(page.locator('[data-testid="empty-activities-current"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-desired"]')).not.toBeVisible();
  });

  test('should not allow submitting empty activity name', async ({ page }) => {
    // The button should be disabled when input is empty
    await expect(page.locator('[data-testid="quick-add-button-current"]')).toBeDisabled();

    // Type a space (which should be trimmed)
    await page.locator('[data-testid="quick-add-input-current"]').fill(' ');

    // Button should still be disabled
    await expect(page.locator('[data-testid="quick-add-button-current"]')).toBeDisabled();

    // Should still show empty state
    await expect(page.locator('[data-testid="empty-activities-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-desired"]')).toBeVisible();
  });

  test('should return focus to input after adding activity', async ({ page }) => {
    // Add a current state activity
    const currentInput = page.locator('[data-testid="quick-add-input-current"]');
    await currentInput.fill('Meditation');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Meditation');

    // Check that input is cleared and has focus
    await expect(currentInput).toHaveValue('');
    await expect(currentInput).toBeFocused();

    // Add a desired state activity
    const desiredInput = page.locator('[data-testid="quick-add-input-desired"]');
    await desiredInput.fill('Überstunden');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Überstunden');

    // Check that input is cleared and has focus
    await expect(desiredInput).toHaveValue('');
    await expect(desiredInput).toBeFocused();
  });
});
