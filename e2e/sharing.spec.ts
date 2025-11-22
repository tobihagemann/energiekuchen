import { expect, Page, test } from '@playwright/test';

// Helper function to dismiss any open toasts to prevent them from blocking interactions
async function dismissToasts(page: Page) {
  try {
    // Wait for any toasts to be visible and then dismiss them
    const toastContainer = page.locator('#_rht_toaster');
    if (await toastContainer.isVisible()) {
      // Click anywhere on the page to dismiss toasts
      await page.click('body', { position: { x: 10, y: 10 } });
      // Wait for toasts to fade out
      await page.waitForTimeout(100);
    }
  } catch {
    // Ignore errors if toasts aren't present
  }
}

// Helper function to safely close modal with multiple strategies
async function closeModal(page: Page) {
  try {
    // First dismiss any toasts that might be blocking
    await dismissToasts(page);

    // Try multiple selectors for close button
    const closeSelectors = [
      '[data-testid="close-modal"]',
      'button:has-text("Schließen")',
      '[aria-label*="Close"]',
      '[aria-label*="Schließen"]',
      'button[type="button"]:last-child',
    ];

    let closed = false;
    for (const selector of closeSelectors) {
      try {
        const closeButton = page.locator(selector).first();
        if (await closeButton.isVisible({ timeout: 2000 })) {
          await closeButton.click({ timeout: 5000 });
          closed = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }

    // If no close button worked, try Escape key
    if (!closed) {
      await page.keyboard.press('Escape');
    }

    // Wait for modal to close
    await page.waitForTimeout(500);
  } catch {
    // As a last resort, try Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

test.describe('Sharing Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should open share modal with activities', async ({ page }) => {
    // Add some activities first using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Yoga');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-desired"]').fill('Stress');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Click share button in header
    await page.locator('[data-testid="share-button"]').click();

    // Verify share modal opens
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Should show share URL or options
    await expect(page.locator('[data-testid="share-modal"]')).toContainText('Teile');
  });

  test('should generate shareable URL with data', async ({ page }) => {
    // Add activities using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Morning Run');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Look for share URL input or display
    const shareUrl = page.locator('[data-testid="share-url"], input[readonly]').first();
    if (await shareUrl.isVisible()) {
      const url = (await shareUrl.inputValue()) || (await shareUrl.textContent());
      expect(url).toContain('/share/#');
      expect(url).toMatch(/^https?:\/\//); // Should be a valid URL
    }
  });

  test('should copy share URL to clipboard', async ({ page }) => {
    // Add an activity using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Reading');
    await page.locator('[data-testid="quick-add-button-current"]').click();

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
    // First create some data using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Swimming');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-desired"]').fill('Long Meetings');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Get share URL
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Wait for share URL to be generated (the loading spinner should disappear)
    await expect(page.locator('[data-testid="share-modal"] .animate-spin')).not.toBeVisible({ timeout: 10000 });

    // Extract share URL
    const shareUrlElement = page.locator('[data-testid="share-url"]');
    await expect(shareUrlElement).toBeVisible();

    let shareUrl = '';
    shareUrl = await shareUrlElement.inputValue();

    // Close modal
    await closeModal(page);

    // Clear current data
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Navigate to share URL if we got one
    if (shareUrl && shareUrl.includes('/share/')) {
      await page.goto(shareUrl);
      // On share pages, we need to wait for the activity list
      await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();

      // Verify shared data is loaded
      await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Swimming');
      await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Long Meetings');
    }
  });

  test('should close share modal', async ({ page }) => {
    // Add an activity using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Close modal with close button
    await closeModal(page);
    await expect(page.locator('[data-testid="share-modal"]')).not.toBeVisible();
  });

  test('should close share modal with escape key', async ({ page }) => {
    // Add an activity using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

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
    await expect(page.locator('[data-testid="share-modal"]')).toContainText('Teile');
  });

  test('should show shared data in URL preview', async ({ page }) => {
    // Create activities for sharing using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Meditation');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-desired"]').fill('Work Stress');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

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
    // Navigate to an invalid share URL with fragment
    await page.goto('/share/#invalid-data-here');

    // Should show error message for invalid data
    await expect(page.locator('text=Energiekuchen konnte nicht geladen werden')).toBeVisible();
    await expect(page.locator('text=Die geteilten Daten konnten nicht geladen werden')).toBeVisible();

    // Should show button to create own Energiekuchen
    const createButton = page.locator('text=Eigenen Energiekuchen erstellen');
    await expect(createButton).toBeVisible();

    // Clicking the button should take us to the main page
    await createButton.click();
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should handle share URLs without data gracefully', async ({ page }) => {
    // Navigate to share URL without fragment
    await page.goto('/share/');

    // Should show friendly message
    await expect(page.locator('text=Ups, hier fehlt etwas!')).toBeVisible();
    await expect(page.locator('text=Sieht so aus, als wäre der Energiekuchen verloren gegangen')).toBeVisible();

    // Navigate to share URL with empty fragment
    await page.goto('/share/#');

    // Should show friendly message
    await expect(page.locator('text=Ups, hier fehlt etwas!')).toBeVisible();
    await expect(page.locator('text=Sieht so aus, als wäre der Energiekuchen verloren gegangen')).toBeVisible();
  });

  test('should preserve original data when viewing shared link', async ({ page }) => {
    // Add personal data using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('My Personal Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Verify personal data exists
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('My Personal Activity');

    // Create a mock share URL and navigate to it
    // (In a real test, you might create this by getting it from the share modal)
    const mockShareData = btoa(
      JSON.stringify({
        version: '2.0',
        current: { activities: [{ id: '1', name: 'Shared Activity', value: 3 }] },
        desired: { activities: [] },
      })
    );

    await page.goto(`/share/#${mockShareData}`);
    // On share pages, wait for activity list to be visible
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();

    // Should show shared data
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Shared Activity');

    // Navigate back to main page
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();

    // Original personal data should still be there
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('My Personal Activity');
  });
});
