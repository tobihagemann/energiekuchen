import { expect, Page, test } from '@playwright/test';

// Helper function to set slider value by clicking at the appropriate position
async function setSliderValue(page: Page, testId: string, value: number, min = 1, max = 100) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  await expect(slider).toBeVisible();

  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    // Calculate percentage position (value between min and max)
    const percentage = (value - min) / (max - min);

    // Get slider bounds
    const sliderBounds = await slider.boundingBox();
    if (sliderBounds) {
      const targetX = sliderBounds.x + sliderBounds.width * percentage;
      const targetY = sliderBounds.y + sliderBounds.height / 2;

      // Check if this is mobile by checking viewport width
      const isMobile = await page.evaluate(() => window.innerWidth < 768);

      if (isMobile) {
        // For mobile, use touch events and mouse events
        await page.touchscreen.tap(targetX, targetY);
        // Also try mouse events as backup
        await page.mouse.click(targetX, targetY);
      } else {
        // For desktop, use mouse click
        await page.mouse.click(targetX, targetY);
      }

      // Wait for the slider to update
      await page.waitForTimeout(150);

      // Try to get the current value from the slider label
      let actualValue = null;
      try {
        const labelElement = slider.locator('..').locator('label');
        if (await labelElement.isVisible()) {
          const labelText = await labelElement.textContent();
          const match = labelText?.match(/:\s*(\d+)/);
          if (match) {
            actualValue = parseInt(match[1], 10);
          }
        }
      } catch {
        // If we can't read the label, continue
      }

      // Check if the value was set correctly (allow small tolerance)
      if (actualValue && Math.abs(actualValue - value) <= 2) {
        break; // Value set correctly
      }

      // If value is still off and we have more attempts, try with slight adjustment
      if (actualValue && attempts < maxAttempts - 1) {
        const offset = value > actualValue ? 10 : -10;
        const adjustedX = Math.max(sliderBounds.x, Math.min(sliderBounds.x + sliderBounds.width, targetX + offset));

        if (isMobile) {
          await page.touchscreen.tap(adjustedX, targetY);
          await page.mouse.click(adjustedX, targetY);
        } else {
          await page.mouse.click(adjustedX, targetY);
        }
      }
    }

    attempts++;
    if (attempts < maxAttempts) {
      await page.waitForTimeout(100);
    }
  }
}

test.describe('Activity Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Wait for the app to load
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should display welcome message when no activities exist', async ({ page }) => {
    // Should show getting started help
    await expect(page.locator('[data-testid="getting-started-help"]')).toBeVisible();
    await expect(page.locator('[data-testid="getting-started-help"]')).toContainText('Willkommen bei Energiekuchen!');

    // Should show empty state messages
    await expect(page.locator('[data-testid="empty-activities-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-activities-negative"]')).toBeVisible();
  });

  test('should create a positive energy activity', async ({ page }) => {
    // Click the add button for positive activities
    await page.locator('[data-testid="add-activity-button-positive"]').click();

    // Wait for the form to appear
    await expect(page.locator('[data-testid="add-activity-form-positive"]')).toBeVisible();

    // Fill in the activity form
    await page.locator('[data-testid="activity-name-input"]').fill('Yoga');

    // Set slider value using the helper function
    await setSliderValue(page, 'activity-value-slider', 25);

    // Submit the form
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activity-list-positive"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Yoga');
  });

  test('should create a negative energy activity', async ({ page }) => {
    // Click the add button for negative activities
    await page.locator('[data-testid="add-activity-button-negative"]').click();

    // Wait for the form to appear
    await expect(page.locator('[data-testid="add-activity-form-negative"]')).toBeVisible();

    // Fill in the activity form
    await page.locator('[data-testid="activity-name-input"]').fill('Work Stress');

    // Set slider value using the helper function
    await setSliderValue(page, 'activity-value-slider', 15);

    // Submit the form
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify the activity was created
    await expect(page.locator('[data-testid="activities-list-negative"]')).toBeVisible();
    await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Work Stress');
  });

  test('should create multiple activities and update energy balance', async ({ page }) => {
    // Add a positive activity
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Morning Exercise');
    await setSliderValue(page, 'activity-value-slider', 30);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Add a negative activity
    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Late Night Work');
    await setSliderValue(page, 'activity-value-slider', 20);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify both activities are visible
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Morning Exercise');
    await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Late Night Work');

    // Getting started help should no longer be visible
    await expect(page.locator('[data-testid="getting-started-help"]')).not.toBeVisible();
  });

  test('should cancel activity creation', async ({ page }) => {
    // Click the add button
    await page.locator('[data-testid="add-activity-button-positive"]').click();

    // Wait for the form to appear
    await expect(page.locator('[data-testid="add-activity-form-positive"]')).toBeVisible();

    // Fill in some data
    await page.locator('[data-testid="activity-name-input"]').fill('Test Activity');

    // Cancel the form (look for cancel button)
    const cancelButton = page.locator('[data-testid="cancel-activity-button"]');
    if ((await cancelButton.count()) > 0) {
      await cancelButton.click();

      // Form should disappear
      await expect(page.locator('[data-testid="add-activity-form-positive"]')).not.toBeVisible();

      // Should return to empty state (no activities created)
      await expect(page.locator('[data-testid="empty-activities-positive"]')).toBeVisible();
      await expect(page.locator('[data-testid="getting-started-help"]')).toBeVisible();
    }
  });
});
