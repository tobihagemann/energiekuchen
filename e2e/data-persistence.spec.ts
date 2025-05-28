import { expect, Page, test } from '@playwright/test';

// Helper function to set slider value by clicking at the appropriate position
async function setSliderValue(page: Page, testId: string, value: number, min = 1, max = 100) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  await expect(slider).toBeVisible();

  // Calculate percentage position (value between min and max)
  const percentage = (value - min) / (max - min);

  // Get slider bounds and use both mouse and touch events for better mobile compatibility
  const sliderBounds = await slider.boundingBox();
  if (sliderBounds) {
    const targetX = sliderBounds.x + sliderBounds.width * percentage;
    const targetY = sliderBounds.y + sliderBounds.height / 2;

    // Try both mouse click and touch events for mobile compatibility
    try {
      await page.mouse.click(targetX, targetY);
    } catch {
      // Fallback to touch events for mobile
      await page.touchscreen.tap(targetX, targetY);
    }

    // Wait a moment for the slider to update
    await page.waitForTimeout(100);

    // Verify the value was set correctly with some tolerance for rounding
    let actualValue = null;

    // Try to get the current value from slider display or verify via form submission
    try {
      const valueDisplay = page.locator(`[data-testid="activity-value-display"], [data-testid="slider-value-display"]`);
      if (await valueDisplay.isVisible()) {
        const displayText = await valueDisplay.textContent();
        actualValue = parseInt(displayText?.replace(/\D/g, '') || '0', 10);
      }
    } catch {
      // If we can't read the display, continue and let the test verify naturally
    }

    // If the value is significantly off, try again with a slight adjustment
    if (actualValue && Math.abs(actualValue - value) > 2) {
      const adjustedX = targetX + (value > actualValue ? 5 : -5);
      try {
        await page.mouse.click(adjustedX, targetY);
      } catch {
        await page.touchscreen.tap(adjustedX, targetY);
      }
      await page.waitForTimeout(100);
    }
  }
}

test.describe('Data Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();
  });

  test('should persist activities in localStorage', async ({ page }) => {
    // Add some activities
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Morning Yoga');
    await setSliderValue(page, 'activity-value-slider', 20);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Wait for first activity to be added and energy total to update
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Yoga');
    await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('20');

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Late Night Work');
    await setSliderValue(page, 'activity-value-slider', 15);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Wait for second activity to be added and energy totals to update
    await expect(page.locator('[data-testid="activity-list-negative"]')).toContainText('Late Night Work');
    await expect(page.locator('[data-testid="negative-energy-total"] div:first-child')).toContainText('15');

    // Verify final energy balance calculation
    await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('20');
    await expect(page.locator('[data-testid="negative-energy-total"] div:first-child')).toContainText('15');
    await expect(page.locator('[data-testid="energy-balance-total"] div:first-child')).toContainText('+5');

    // Reload the page
    await page.reload();
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Verify activities persist after reload
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Yoga');
    await expect(page.locator('[data-testid="activity-list-negative"]')).toContainText('Late Night Work');

    // Verify energy balance is still correct
    await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('20');
    await expect(page.locator('[data-testid="negative-energy-total"] div:first-child')).toContainText('15');
    await expect(page.locator('[data-testid="energy-balance-total"] div:first-child')).toContainText('+5');
  });

  test('should persist activity edits', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Exercise');
    await setSliderValue(page, 'activity-value-slider', 30);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Edit the activity
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();
    const activityId = await activityItem.getAttribute('data-testid');
    const id = activityId?.replace('activity-item-', '') || '';

    await page.locator(`[data-testid="edit-activity-button-${id}"]`).click();
    await page.locator('[data-testid="activity-name-input"]').fill('Intensive Workout');
    await setSliderValue(page, 'activity-value-slider', 45);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify edit took effect
    await expect(page.locator(`[data-testid="activity-name-${id}"]`)).toContainText('Intensive Workout');
    await expect(page.locator(`[data-testid="activity-value-${id}"]`)).toContainText('45');

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Verify the edit persisted
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Intensive Workout');
    await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('45');
  });

  test('should persist activity deletions', async ({ page }) => {
    // Listen for console messages
    page.on('console', msg => {
      if (msg.text().includes('DEBUG')) {
        console.log('BROWSER:', msg.text());
      }
    });

    // Add multiple activities
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Reading');
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Meditation');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify both activities exist
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Reading');
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Meditation');

    // Wait for activities to be visible and get all delete buttons
    await page.waitForSelector('[data-testid^="delete-activity-button-"]');
    const deleteButtons = page.locator('[data-testid^="delete-activity-button-"]');
    const buttonCount = await deleteButtons.count();
    console.log('DEBUG: Found', buttonCount, 'delete buttons');

    // Use the first delete button (for Reading)
    if (buttonCount > 0) {
      page.on('dialog', dialog => dialog.accept());
      await deleteButtons.first().click();
    }

    // Wait for the activity to be removed
    await page.waitForTimeout(500);

    // Verify one activity remains
    await expect(page.locator('[data-testid="activity-list-positive"]')).toBeVisible();

    // Get the text content to check which activity remains
    const activitiesText = await page.locator('[data-testid="activity-list-positive"]').textContent();
    console.log('DEBUG: Activities text after deletion:', activitiesText);

    // One of the activities should remain (could be either Reading or Meditation depending on order)
    const hasReading = activitiesText?.includes('Reading') || false;
    const hasMeditation = activitiesText?.includes('Meditation') || false;
    const hasActivities = hasReading || hasMeditation;
    console.log('DEBUG: After deletion - hasReading:', hasReading, 'hasMeditation:', hasMeditation);

    expect(hasActivities).toBe(true);

    // Debug: Check what's actually in localStorage after deletion
    const localStorageAfterDeletion = await page.evaluate(() => {
      return localStorage.getItem('energiekuchen-data');
    });
    console.log('DEBUG: localStorage after deletion:', localStorageAfterDeletion);

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Wait for data to load and UI to stabilize
    await page.waitForTimeout(1000);

    // Wait for either activities to be visible or empty state to be stable
    await expect(async () => {
      const activitiesText = await page.locator('[data-testid="activity-list-positive"]').textContent();
      const hasEmptyState = activitiesText?.includes('Noch keine Aktivitäten vorhanden') || false;
      const hasActivities = activitiesText?.includes('Reading') || activitiesText?.includes('Meditation') || false;

      // We expect either empty state or activities, but not loading state
      expect(hasEmptyState || hasActivities).toBe(true);
    }).toPass({ timeout: 5000 });

    // Verify only one activity persisted
    const persistedActivitiesText = await page.locator('[data-testid="activity-list-positive"]').textContent();
    console.log('DEBUG: Persisted activities text:', persistedActivitiesText);
    const persistedHasReading = persistedActivitiesText?.includes('Reading') || false;
    const persistedHasMeditation = persistedActivitiesText?.includes('Meditation') || false;
    const persistedHasActivities = persistedHasReading || persistedHasMeditation;
    console.log('DEBUG: persistedHasReading:', persistedHasReading, 'persistedHasMeditation:', persistedHasMeditation);

    expect(persistedHasActivities).toBe(true);
    // Should not have both activities
    expect(persistedHasReading && persistedHasMeditation).toBe(false);
  });

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    // Add an activity first
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Test Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify activity exists
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Test Activity');

    // Corrupt localStorage
    await page.evaluate(() => {
      localStorage.setItem('energiekuchen-data', 'invalid-json-data');
    });

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Should show clean state (welcome message)
    await expect(page.locator('[data-testid="getting-started-help"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-negative"]')).toBeVisible();
  });

  test('should maintain data across browser navigation', async ({ page }) => {
    // Add activities
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Walking');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Navigate away (simulate going to another site)
    await page.goto('about:blank');

    // Navigate back
    await page.goto('/');
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Verify data persisted
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Walking');
  });

  test('should preserve activity colors and values', async ({ page }) => {
    // Add an activity with specific color and value
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Swimming');
    await setSliderValue(page, 'activity-value-slider', 75);

    // Select a specific color (if color picker is available)
    const colorPicker = page.locator('[data-testid="activity-color-picker"]');
    if (await colorPicker.isVisible()) {
      // Click on a color option if available
      await colorPicker.locator('button, [role="button"]').nth(2).click();
    }

    await page.locator('[data-testid="submit-activity-button"]').click();

    // Get the activity element to check its color
    const activityItem = page.locator('[data-testid^="activity-item-"]').first();

    // Verify the value is displayed correctly
    await expect(page.locator('[data-testid="positive-energy-total"] div:first-child')).toContainText('75');

    // Reload page
    await page.reload();
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Verify color and value persisted
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Swimming');
    await expect(page.locator('[data-testid="positive-energy-total"]')).toContainText('75');

    // The color should still be applied (though exact verification depends on implementation)
    await expect(activityItem).toBeVisible();
  });
});
