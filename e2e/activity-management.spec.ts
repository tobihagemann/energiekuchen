import { expect, test } from '@playwright/test';

test.describe('Activity Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should display empty state when no activities exist', async ({ page }) => {
    // Should show empty state messages
    await expect(page.locator('[data-testid="empty-activities-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-negative"]')).toBeVisible();
  });

  test('should create a positive energy activity', async ({ page }) => {
    // Type activity name in the quick add input
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Yoga');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Yoga');
  });

  test('should create a negative energy activity', async ({ page }) => {
    // Type activity name in the quick add input
    await page.locator('[data-testid="quick-add-input-negative"]').fill('Work Stress');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-negative"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activities-list-negative"]')).toBeVisible();
    await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Work Stress');
  });

  test('should create multiple activities and update energy balance', async ({ page }) => {
    // Add a positive activity
    await page.locator('[data-testid="quick-add-input-positive"]').fill('Morning Exercise');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Add a negative activity
    await page.locator('[data-testid="quick-add-input-negative"]').fill('Late Night Work');
    await page.locator('[data-testid="quick-add-button-negative"]').click();

    // Verify both activities are visible
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Exercise');
    await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Late Night Work');

    // Empty state should no longer be visible for lists with activities
    await expect(page.locator('[data-testid="empty-activities-positive"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-negative"]')).not.toBeVisible();
  });

  test('should not allow submitting empty activity name', async ({ page }) => {
    // The button should be disabled when input is empty
    await expect(page.locator('[data-testid="quick-add-button-positive"]')).toBeDisabled();

    // Type a space (which should be trimmed)
    await page.locator('[data-testid="quick-add-input-positive"]').fill(' ');

    // Button should still be disabled
    await expect(page.locator('[data-testid="quick-add-button-positive"]')).toBeDisabled();

    // Should still show empty state
    await expect(page.locator('[data-testid="empty-activities-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-negative"]')).toBeVisible();
  });

  test('should return focus to input after adding activity', async ({ page }) => {
    // Add a positive activity
    const positiveInput = page.locator('[data-testid="quick-add-input-positive"]');
    await positiveInput.fill('Meditation');
    await page.locator('[data-testid="quick-add-button-positive"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Meditation');

    // Check that input is cleared and has focus
    await expect(positiveInput).toHaveValue('');
    await expect(positiveInput).toBeFocused();

    // Add a negative activity
    const negativeInput = page.locator('[data-testid="quick-add-input-negative"]');
    await negativeInput.fill('Überstunden');
    await page.locator('[data-testid="quick-add-button-negative"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-negative"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-negative"]')).toContainText('Überstunden');

    // Check that input is cleared and has focus
    await expect(negativeInput).toHaveValue('');
    await expect(negativeInput).toBeFocused();
  });
});
