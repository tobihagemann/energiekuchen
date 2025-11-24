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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Yoga');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Yoga');
  });

  test('should create a desired state activity', async ({ page }) => {
    // Type activity name in the quick add input
    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Work Stress');

    // Click the quick add button
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Work Stress');
  });

  test('should create multiple activities in both states', async ({ page }) => {
    // Add a current state activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Morning Exercise');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Add a desired state activity
    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Late Night Work');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

    // Verify both activities are visible
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Morning Exercise');
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Late Night Work');

    // Empty state should no longer be visible for lists with activities
    await expect(page.locator('[data-testid="empty-activities-current"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-desired"]')).not.toBeVisible();
  });

  test('should not allow submitting empty activity name', async ({ page }) => {
    // The button should be disabled when input is empty
    await expect(page.locator('[data-testid="quick-add-button-positive-current"]')).toBeDisabled();

    // Type a space (which should be trimmed)
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill(' ');

    // Button should still be disabled
    await expect(page.locator('[data-testid="quick-add-button-positive-current"]')).toBeDisabled();

    // Should still show empty state
    await expect(page.locator('[data-testid="empty-activities-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-desired"]')).toBeVisible();
  });

  test('should return focus to input after adding activity', async ({ page }) => {
    // Add a current state activity
    const currentInput = page.locator('[data-testid="quick-add-input-positive-current"]');
    await currentInput.fill('Meditation');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Meditation');

    // Check that input is cleared and has focus
    await expect(currentInput).toHaveValue('');
    await expect(currentInput).toBeFocused();

    // Add a desired state activity
    const desiredInput = page.locator('[data-testid="quick-add-input-negative-desired"]');
    await desiredInput.fill('Überstunden');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

    // Wait for the activity to be added
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Überstunden');

    // Check that input is cleared and has focus
    await expect(desiredInput).toHaveValue('');
    await expect(desiredInput).toBeFocused();
  });

  test('should show copy button only when desired chart is empty', async ({ page }) => {
    // Copy button should be visible in desired chart empty state
    await expect(page.locator('[data-testid="copy-from-current-chart-button"]')).toBeVisible();

    // Add an activity to desired chart
    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Stress');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

    // Wait for activity to be added
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Stress');

    // Copy button should no longer be visible
    await expect(page.locator('[data-testid="copy-from-current-chart-button"]')).not.toBeVisible();
  });

  test('should disable copy button when current chart is empty', async ({ page }) => {
    // Copy button should be visible but disabled when current chart is empty
    const copyButton = page.locator('[data-testid="copy-from-current-chart-button"]');
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toBeDisabled();
  });

  test('should enable copy button when current chart has activities', async ({ page }) => {
    const copyButton = page.locator('[data-testid="copy-from-current-chart-button"]');

    // Initially disabled
    await expect(copyButton).toBeDisabled();

    // Add activity to current chart
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Yoga');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Wait for activity to be added
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Yoga');

    // Copy button should now be enabled
    await expect(copyButton).toBeEnabled();
  });

  test('should copy all activities from current to desired chart', async ({ page }) => {
    // Add multiple activities to current chart
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Yoga');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Yoga');

    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Lesen');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Lesen');

    await page.locator('[data-testid="quick-add-input-negative-current"]').fill('Arbeit');
    await page.locator('[data-testid="quick-add-button-negative-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Arbeit');

    // Desired chart should still be empty
    await expect(page.locator('[data-testid="empty-activities-desired"]')).toBeVisible();

    // Click copy button
    const copyButton = page.locator('[data-testid="copy-from-current-chart-button"]');
    await expect(copyButton).toBeEnabled();
    await copyButton.click();

    // Wait for activities to be copied
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();

    // Verify all activities were copied to desired chart
    const desiredList = page.locator('[data-testid="activity-list-desired"]');
    await expect(desiredList).toContainText('Yoga');
    await expect(desiredList).toContainText('Lesen');
    await expect(desiredList).toContainText('Arbeit');

    // Current chart should still have the same activities
    const currentList = page.locator('[data-testid="activity-list-current"]');
    await expect(currentList).toContainText('Yoga');
    await expect(currentList).toContainText('Lesen');
    await expect(currentList).toContainText('Arbeit');

    // Copy button should no longer be visible
    await expect(copyButton).not.toBeVisible();
  });

  test('should hide copy button after activities are copied', async ({ page }) => {
    // Add activity to current chart
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Sport');

    // Copy button should be visible and enabled
    const copyButton = page.locator('[data-testid="copy-from-current-chart-button"]');
    await expect(copyButton).toBeVisible();
    await expect(copyButton).toBeEnabled();

    // Click copy button
    await copyButton.click();

    // Wait for copy to complete
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Sport');

    // Copy button should no longer be visible (desired chart is no longer empty)
    await expect(copyButton).not.toBeVisible();

    // Empty state should not be visible
    await expect(page.locator('[data-testid="empty-activities-desired"]')).not.toBeVisible();
  });

  test('should not show copy button in current chart empty state', async ({ page }) => {
    // Current chart should not have a copy button in its empty state
    const currentEmptyState = page.locator('[data-testid="empty-activities-current"]');
    await expect(currentEmptyState).toBeVisible();

    // Copy button should only exist in desired chart (now in the chart center, not activity list)
    const copyButton = page.locator('[data-testid="copy-from-current-chart-button"]');
    await expect(copyButton).toBeVisible();

    // Verify the button is within the desired state section (chart area)
    const desiredSection = page.locator('[data-testid="desired-state-section"]');
    const copyButtonInDesired = desiredSection.locator('[data-testid="copy-from-current-chart-button"]');
    await expect(copyButtonInDesired).toBeVisible();
  });

  test('should add activity with details via edit modal', async ({ page }) => {
    // Add an activity first
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Sport');

    // Get the activity ID and click edit button
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';
    const editButton = page.locator(`[data-testid="edit-activity-button-${id}"]`);
    await editButton.click();

    // Wait for edit modal to open
    const editModal = page.locator('[data-testid="edit-activity-modal"]');
    await expect(editModal).toBeVisible();

    // Fill in details
    const detailsInput = editModal.locator('[data-testid="activity-details-input"]');
    await expect(detailsInput).toBeVisible();
    await detailsInput.fill('Jeden Tag 30 Minuten joggen');

    // Submit the form
    await editModal.locator('[data-testid="submit-activity-button"]').click();

    // Wait for modal to close
    await expect(editModal).not.toBeVisible();

    // Verify details are displayed in activity list
    const activityDetails = page.locator(`[data-testid="activity-details-${id}"]`);
    await expect(activityDetails).toBeVisible();
    await expect(activityDetails).toContainText('Jeden Tag 30 Minuten joggen');
  });

  test('should display multi-line details in activity list', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Meditation');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Meditation');

    // Edit activity to add multi-line details
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';
    await page.locator(`[data-testid="edit-activity-button-${id}"]`).click();

    // Fill in multi-line details
    const editModal = page.locator('[data-testid="edit-activity-modal"]');
    const detailsInput = editModal.locator('[data-testid="activity-details-input"]');
    await detailsInput.fill('Morgens 10 Minuten\nAbends 10 Minuten\nFokus auf Atmung');
    await editModal.locator('[data-testid="submit-activity-button"]').click();

    // Wait for modal to close
    await expect(editModal).not.toBeVisible();

    // Verify multi-line details are displayed
    const activityDetails = page.locator(`[data-testid="activity-details-${id}"]`);
    await expect(activityDetails).toBeVisible();
    await expect(activityDetails).toContainText('Morgens 10 Minuten');
    await expect(activityDetails).toContainText('Abends 10 Minuten');
    await expect(activityDetails).toContainText('Fokus auf Atmung');
  });

  test('should enforce 150 character limit for details', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Lesen');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Lesen');

    // Edit activity
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';
    await page.locator(`[data-testid="edit-activity-button-${id}"]`).click();

    // Try to enter more than 150 characters
    const editModal = page.locator('[data-testid="edit-activity-modal"]');
    const detailsInput = editModal.locator('[data-testid="activity-details-input"]');
    const longText = 'a'.repeat(151);
    await detailsInput.fill(longText);

    // The maxLength attribute should prevent entering more than 150 characters
    // Verify the value is truncated to 150 characters
    const actualValue = await detailsInput.inputValue();
    expect(actualValue.length).toBe(150);
  });

  test('should allow editing details to empty string', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Wandern');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Wandern');

    // Edit activity and add details
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';
    await page.locator(`[data-testid="edit-activity-button-${id}"]`).click();

    const editModal = page.locator('[data-testid="edit-activity-modal"]');
    const detailsInput = editModal.locator('[data-testid="activity-details-input"]');
    await detailsInput.fill('Jedes Wochenende');
    await editModal.locator('[data-testid="submit-activity-button"]').click();
    await expect(editModal).not.toBeVisible();

    // Verify details are shown
    const detailsLocator = page.locator(`[data-testid="activity-details-${id}"]`);
    await expect(detailsLocator).toBeVisible();
    await expect(detailsLocator).toContainText('Jedes Wochenende');

    // Edit again and remove details
    await page.locator(`[data-testid="edit-activity-button-${id}"]`).click();
    await expect(editModal).toBeVisible();
    await detailsInput.fill('');
    await editModal.locator('[data-testid="submit-activity-button"]').click();
    await expect(editModal).not.toBeVisible();

    // Wait a bit for the DOM to update
    await page.waitForTimeout(100);

    // Details element should not be in the DOM when details are empty
    const detailsCount = await page.locator(`[data-testid="activity-details-${id}"]`).count();
    expect(detailsCount).toBe(0);
  });
});
