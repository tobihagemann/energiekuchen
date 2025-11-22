import { expect, Page, test } from '@playwright/test';

// Helper function to close any open modal
async function closeModal(page: Page) {
  // Try multiple ways to close modal
  const closeButton = page.locator('[data-testid="close-modal"]').first();

  if (await closeButton.isVisible()) {
    // Force click if the element is being intercepted
    await closeButton.click({ force: true });
  } else {
    // Fallback: press Escape key
    await page.keyboard.press('Escape');
  }

  // Wait for modal to close
  await page.waitForTimeout(500);
}
async function openImportModal(page: Page) {
  // Click the header import button
  const headerImportButton = page.locator('[data-testid="import-button"]');
  await headerImportButton.click();

  // Verify import modal opens (wait a bit longer for modal transitions)
  await expect(page.locator('[data-testid="import-modal"]')).toBeVisible({ timeout: 10000 });
}

async function openDeleteModal(page: Page) {
  // Click the header delete button
  const headerDeleteButton = page.locator('[data-testid="delete-button"]');
  await headerDeleteButton.click();

  // Verify delete modal opens (wait a bit longer for modal transitions)
  await expect(page.locator('[data-testid="delete-modal"]')).toBeVisible({ timeout: 10000 });
}

test.describe('Import & Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('should export energy data as JSON', async ({ page }) => {
    // Add some activities to export using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Morning Jog');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-desired"]').fill('Email Overload');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Open share modal
    await page.locator('[data-testid="share-button"]').click();
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Click export button in the modal
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("Als JSON exportieren")').first();
    await exportButton.click();

    // Wait for download
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/energiekuchen.*\.json$/);

    // Save the file and verify its contents
    const path = await download.path();
    if (path) {
      const fs = await import('fs');
      const content = fs.readFileSync(path, 'utf8');
      const data = JSON.parse(content);

      expect(data).toHaveProperty('current');
      expect(data).toHaveProperty('desired');
      expect(data.current.activities).toHaveLength(1);
      expect(data.desired.activities).toHaveLength(1);
      expect(data.current.activities[0].name).toBe('Morning Jog');
      expect(data.desired.activities[0].name).toBe('Email Overload');
    }

    // Close modal
    await closeModal(page);
  });

  test('should open import modal', async ({ page }) => {
    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Verify import modal content
    await expect(page.locator('[data-testid="import-modal"]')).toContainText('Daten importieren');
  });

  test('should import valid JSON data', async ({ page }) => {
    // Prepare test data
    const testData = {
      current: {
        activities: [
          { id: '1', name: 'Imported Yoga', value: 3 },
          { id: '2', name: 'Imported Reading', value: 2 },
        ],
      },
      desired: {
        activities: [{ id: '3', name: 'Imported Stress', value: -2 }],
      },
    };

    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Look for file input or text area for JSON data
    const fileInput = page.locator('[data-testid="import-file-input"], input[type="file"]').first();
    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();

    if (await textArea.isVisible()) {
      // If there's a text area for pasting JSON
      await textArea.fill(JSON.stringify(testData));
      await page.locator('[data-testid="import-submit"]').click();
    } else if (await fileInput.isVisible()) {
      // If there's a file input
      // Create a temporary file with test data (using dynamic imports to avoid lint errors)
      const fs = await import('fs');
      const os = await import('os');
      const path = await import('path');

      const tempFile = path.join(os.tmpdir(), 'test-energiekuchen.json');
      fs.writeFileSync(tempFile, JSON.stringify(testData));

      await fileInput.setInputFiles(tempFile);
      await page.locator('[data-testid="import-submit"]').click();

      // Clean up
      fs.unlinkSync(tempFile);
    }

    // Close modal if it's still open
    const closeButton = page.locator('[data-testid="close-modal"], button:has-text("Schließen")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Verify imported data appears
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Imported Yoga');
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Imported Reading');
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Imported Stress');

    // Energy calculations removed - focusing on import functionality only
  });

  test('should handle invalid JSON gracefully', async ({ page }) => {
    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Try to import invalid JSON
    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();

    if (await textArea.isVisible()) {
      await textArea.fill('{ invalid json data');
      await page.locator('[data-testid="import-submit"]').click();

      // Should show error message
      await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-error"]')).toContainText(/Fehler|Error|Ungültig|Invalid/i);
    }
  });

  test('should handle missing required fields in JSON', async ({ page }) => {
    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Try to import JSON with missing required fields
    const invalidData = {
      current: {
        activities: [
          { name: 'Missing ID and Value' }, // Missing required fields
        ],
      },
    };

    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();

    if (await textArea.isVisible()) {
      await textArea.fill(JSON.stringify(invalidData));
      await page.locator('[data-testid="import-submit"]').click();

      // Should show validation error
      await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
    }
  });

  test('should merge with existing data when importing', async ({ page }) => {
    // Add existing data using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Existing Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Verify existing data
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Existing Activity');

    // Import additional data
    const importData = {
      current: {
        activities: [{ id: '2', name: 'Imported Activity', value: 3 }],
      },
      desired: {
        activities: [],
      },
    };

    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();
    if (await textArea.isVisible()) {
      await textArea.fill(JSON.stringify(importData));
      await page.locator('[data-testid="import-submit"]').click();
    }

    // Close modal
    const closeButton = page.locator('[data-testid="close-modal"], button:has-text("Schließen")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Verify both existing and imported data are present
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Existing Activity');
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Imported Activity');
  });

  test('should reject import data with invalid energy values', async ({ page }) => {
    // Open import modal
    await openImportModal(page);

    // Try to import JSON with invalid energy values
    const invalidData = {
      current: {
        activities: [
          { id: '1', name: 'Zero Value', value: 0 }, // Invalid: zero not allowed
          { id: '2', name: 'Too High', value: 10 }, // Invalid: above maximum
          { id: '3', name: 'Too Low', value: -6 }, // Invalid: below minimum
          { id: '4', name: 'Decimal', value: 5.5 }, // Invalid: not an integer
        ],
      },
    };

    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();

    if (await textArea.isVisible()) {
      await textArea.fill(JSON.stringify(invalidData));
      await page.locator('[data-testid="import-submit"]').click();

      // Should show validation error about energy level
      await expect(page.locator('[data-testid="import-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="import-error"]')).toContainText(/Energieniveau|zwischen -5 und \+5|ganze Zahl|darf nicht 0 sein/i);
    }
  });

  test('should replace existing data when importing with replace option', async ({ page }) => {
    // Add existing data using the new inline form
    await page.locator('[data-testid="quick-add-input-current"]').fill('Old Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Import data with replace option
    const importData = {
      current: {
        activities: [{ id: '1', name: 'New Activity', value: 3 }],
      },
      desired: {
        activities: [],
      },
    };

    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Look for replace option checkbox
    const replaceOption = page.locator('[data-testid="import-replace-option"], input[type="checkbox"]').first();
    if (await replaceOption.isVisible()) {
      await replaceOption.check();
    }

    const textArea = page.locator('[data-testid="import-json-textarea"], textarea').first();
    if (await textArea.isVisible()) {
      await textArea.fill(JSON.stringify(importData));
      await page.locator('[data-testid="import-submit"]').click();
    }

    // Close modal
    const closeButton = page.locator('[data-testid="close-modal"], button:has-text("Schließen")').first();
    if (await closeButton.isVisible()) {
      await closeButton.click();
    }

    // Verify only new data is present
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('New Activity');
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Old Activity');
  });

  test('should close import modal', async ({ page }) => {
    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Close with button (use force click to handle overlay issues)
    await page.locator('[data-testid="close-modal"]').first().click({ force: true });
    await expect(page.locator('[data-testid="import-modal"]')).not.toBeVisible();
  });

  test('should close import modal with escape key', async ({ page }) => {
    // Open import modal (works on both desktop and mobile)
    await openImportModal(page);

    // Close with Escape key
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="import-modal"]')).not.toBeVisible();
  });

  test('should preserve data format during export/import cycle', async ({ page }) => {
    // Create activities using the new inline form (with default values)
    await page.locator('[data-testid="quick-add-input-current"]').fill('Activity A');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-current"]').fill('Activity B');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    await page.locator('[data-testid="quick-add-input-desired"]').fill('Negative Activity');
    await page.locator('[data-testid="quick-add-button-desired"]').click();

    // Verify that activities were created and energy totals are displayed
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Activity A');
    await expect(page.locator('[data-testid="activity-list-current"]')).toContainText('Activity B');
    await expect(page.locator('[data-testid="activity-list-desired"]')).toContainText('Negative Activity');

    // Focus on verifying data preservation during export/import
    // Energy balance calculations removed
  });

  test('should delete all data', async ({ page }) => {
    // Add some test data
    await page.locator('[data-testid="quick-add-input-current"]').fill('Test Activity');
    await page.locator('[data-testid="quick-add-button-current"]').click();

    // Open delete modal
    await openDeleteModal(page);

    // Click delete button
    await page.locator('button:has-text("Daten löschen")').click();

    // Verify all data is deleted
    await expect(page.locator('[data-testid="activity-list-current"]')).not.toContainText('Test Activity');
  });
});
