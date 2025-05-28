import { expect, Page, test } from '@playwright/test';

// Helper function to set slider value by clicking at the appropriate position
async function setSliderValue(page: Page, testId: string, value: number, min = 1, max = 100) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  await expect(slider).toBeVisible();

  // Calculate percentage position (value between min and max)
  const percentage = (value - min) / (max - min);

  // Get slider bounds and click at the calculated position
  const sliderBounds = await slider.boundingBox();
  if (sliderBounds) {
    const targetX = sliderBounds.x + sliderBounds.width * percentage;
    const targetY = sliderBounds.y + sliderBounds.height / 2;
    await page.mouse.click(targetX, targetY);
  }
}

test.describe('Sharing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();
  });

  test('should open share modal with activities', async ({ page }) => {
    // Add some activities first
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Yoga');
    await setSliderValue(page, 'activity-value-slider', 25);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Stress');
    await setSliderValue(page, 'activity-value-slider', 15);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Click share button in header
    await page.locator('[data-testid="share-button"]').click();

    // Verify share modal opens
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Should show share URL or options
    await expect(page.locator('[data-testid="share-modal"]')).toContainText('Teilen');
  });

  test('should generate shareable URL with data', async ({ page }) => {
    // Add activities
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Morning Run');
    await setSliderValue(page, 'activity-value-slider', 30);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Look for share URL input or display
    const shareUrl = page.locator('[data-testid="share-url"], input[readonly]').first();
    if (await shareUrl.isVisible()) {
      const url = (await shareUrl.inputValue()) || (await shareUrl.textContent());
      expect(url).toContain('/share/');
      expect(url).toMatch(/^https?:\/\//); // Should be a valid URL
    }
  });

  test('should copy share URL to clipboard', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Reading');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    // Click copy button
    const copyButton = page.locator('[data-testid="copy-share-url"], button:has-text("Kopieren")').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Verify success feedback
      await expect(page.locator('text=Kopiert, text=Link kopiert')).toBeVisible();
    }
  });

  test('should load shared data from URL', async ({ page }) => {
    // First create some data
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Swimming');
    await setSliderValue(page, 'activity-value-slider', 40);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Long Meetings');
    await setSliderValue(page, 'activity-value-slider', 20);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Get share URL
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Extract share URL (this will depend on the actual implementation)
    const shareUrlElement = page.locator('[data-testid="share-url"], input[readonly]').first();
    let shareUrl = '';

    if (await shareUrlElement.isVisible()) {
      shareUrl = (await shareUrlElement.inputValue()) || (await shareUrlElement.textContent()) || '';
    }

    // Close modal
    await page.locator('[data-testid="close-modal"], button:has-text("Schließen")').first().click();

    // Clear current data
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Navigate to share URL if we got one
    if (shareUrl && shareUrl.includes('/share/')) {
      await page.goto(shareUrl);
      await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

      // Verify shared data is loaded
      await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Swimming');
      await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Long Meetings');
      await expect(page.locator('[data-testid="positive-energy-total"]')).toContainText('40');
      await expect(page.locator('[data-testid="negative-energy-total"]')).toContainText('20');
      await expect(page.locator('[data-testid="energy-balance-total"]')).toContainText('+20');
    }
  });

  test('should close share modal', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Test Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Close modal with close button
    await page.locator('[data-testid="close-modal"], button:has-text("Schließen")').first().click();
    await expect(page.locator('[data-testid="share-modal"]')).not.toBeVisible();
  });

  test('should close share modal with escape key', async ({ page }) => {
    // Add an activity
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Test Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Close modal with Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="share-modal"]')).not.toBeVisible();
  });

  test('should handle empty data sharing', async ({ page }) => {
    // Try to share with no activities
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Should still show share modal but might have empty state message
    await expect(page.locator('[data-testid="share-modal"]')).toContainText('Teilen');
  });

  test('should show shared energy balance in URL preview', async ({ page }) => {
    // Create a specific energy balance scenario
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Meditation');
    await setSliderValue(page, 'activity-value-slider', 50);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Work Stress');
    await setSliderValue(page, 'activity-value-slider', 30);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify current balance
    await expect(page.locator('[data-testid="energy-balance-total"] div:first-child')).toContainText('+20');

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // The share modal might show a preview of the shared data
    // This depends on the implementation
    const sharePreview = page.locator('[data-testid="share-preview"]');
    if (await sharePreview.isVisible()) {
      await expect(sharePreview).toContainText('Meditation');
      await expect(sharePreview).toContainText('Work Stress');
    }
  });

  test('should handle invalid share URLs gracefully', async ({ page }) => {
    // Navigate to an invalid share URL
    await page.goto('/share/invalid-data-here');

    // Should redirect to main page or show error message
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Should show empty state since invalid data
    await expect(page.locator('[data-testid="getting-started-help"]')).toBeVisible();
  });

  test('should preserve original data when viewing shared link', async ({ page }) => {
    // Add personal data
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('My Personal Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify personal data exists
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('My Personal Activity');

    // Create a mock share URL and navigate to it
    // (In a real test, you might create this by getting it from the share modal)
    const mockShareData = btoa(
      JSON.stringify({
        positive: { activities: [{ id: '1', name: 'Shared Activity', value: 25, color: '#10b981' }] },
        negative: { activities: [] },
      })
    );

    await page.goto(`/share/${mockShareData}`);
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Should show shared data
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Shared Activity');

    // Navigate back to main page
    await page.goto('/');
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();

    // Original personal data should still be there
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('My Personal Activity');
  });
});
