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

    // Getting started help should no longer be visible
    await expect(page.locator('[data-testid="getting-started-help"]')).not.toBeVisible();
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
    await expect(page.locator('[data-testid="getting-started-help"]')).toBeVisible();
  });
});
