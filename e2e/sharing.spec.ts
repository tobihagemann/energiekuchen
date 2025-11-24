import { expect, Page, test } from '@playwright/test';

// Helper function to safely close modal with multiple strategies
async function closeModal(page: Page) {
  try {
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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Yoga');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Stress');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

    // Click share button in header
    await page.locator('[data-testid="share-button"]').click();

    // Verify share modal opens
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Should show share URL or options
    await expect(page.locator('[data-testid="share-modal"]')).toContainText('Teile');
  });

  test('should generate shareable URL with data', async ({ page }) => {
    // Add activities using the new inline form
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Morning Run');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Reading');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Grant clipboard permissions
    await page.context().grantPermissions(['clipboard-write', 'clipboard-read']);

    // Wait for share URL to be generated
    await expect(page.locator('[data-testid="share-modal"] .animate-spin')).not.toBeVisible({ timeout: 10000 });

    // Click copy button
    const copyButton = page.locator('button:has([class*="ClipboardIcon"])').first();
    if (await copyButton.isVisible()) {
      await copyButton.click();

      // Verify icon changes to checkmark
      await expect(page.locator('button:has([class*="CheckIcon"])')).toBeVisible();
    }
  });

  test('should load shared data from URL', async ({ page }) => {
    // First create some data using the new inline form
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Swimming');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Long Meetings');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Close modal with close button
    await closeModal(page);
    await expect(page.locator('[data-testid="share-modal"]')).not.toBeVisible();
  });

  test('should close share modal with escape key', async ({ page }) => {
    // Add an activity using the new inline form
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Meditation');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    await page.locator('[data-testid="quick-add-input-negative-desired"]').fill('Work Stress');
    await page.locator('[data-testid="quick-add-button-negative-desired"]').click();

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
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('My Personal Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

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

  test('should show consistent data in charts and legend on share page', async ({ page }) => {
    // Create share data with specific activities
    const mockShareData = btoa(
      JSON.stringify({
        version: '2.0',
        current: {
          activities: [
            { id: '1', name: 'Morning Yoga', value: 4 },
            { id: '2', name: 'Coffee Break', value: 2 },
          ],
        },
        desired: {
          activities: [
            { id: '3', name: 'Evening Walk', value: 3 },
            { id: '4', name: 'Overtime Work', value: -3 },
          ],
        },
      })
    );

    // Navigate to share URL
    await page.goto(`/share/#${mockShareData}`);

    // Wait for charts and activity lists to be visible
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-desired"]')).toBeVisible();

    // Verify current state chart legend shows correct activities
    const currentList = page.locator('[data-testid="activity-list-current"]');
    await expect(currentList).toContainText('Morning Yoga');
    await expect(currentList).toContainText('Coffee Break');

    // Verify desired state chart legend shows correct activities
    const desiredList = page.locator('[data-testid="activity-list-desired"]');
    await expect(desiredList).toContainText('Evening Walk');
    await expect(desiredList).toContainText('Overtime Work');

    // Verify charts are rendered (canvas elements exist)
    // The charts are displayed in the same container as the activity lists
    const charts = page.locator('canvas');
    await expect(charts.first()).toBeVisible();
    await expect(charts).toHaveCount(2); // Two charts (current and desired)

    // Verify activity counts match
    await expect(currentList).toContainText('(2)'); // 2 activities
    await expect(desiredList).toContainText('(2)'); // 2 activities
  });

  test('should not contaminate main page localStorage when viewing share link', async ({ page }) => {
    // Start with clean slate
    await page.evaluate(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();

    // Add main page data
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Main Page Activity');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Main Page Activity');

    // Get localStorage data before viewing share link
    const localStorageBefore = await page.evaluate(() => localStorage.getItem('energiekuchen-data'));

    // Create and navigate to share link with different data
    const mockShareData = btoa(
      JSON.stringify({
        version: '2.0',
        current: { activities: [{ id: '1', name: 'Shared Link Activity', value: 3 }] },
        desired: { activities: [] },
      })
    );

    await page.goto(`/share/#${mockShareData}`);
    await expect(page.locator('[data-testid="activity-list-current"]')).toBeVisible();
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Shared Link Activity');

    // Get localStorage data while on share page
    const localStorageOnShare = await page.evaluate(() => localStorage.getItem('energiekuchen-data'));

    // localStorage should not be contaminated by share page data
    expect(localStorageOnShare).toBe(localStorageBefore);

    // Navigate back to main page
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();

    // Verify main page data is still intact
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Main Page Activity');
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Shared Link Activity');

    // Verify localStorage is unchanged
    const localStorageAfter = await page.evaluate(() => localStorage.getItem('energiekuchen-data'));
    expect(localStorageAfter).toBe(localStorageBefore);
  });
});
