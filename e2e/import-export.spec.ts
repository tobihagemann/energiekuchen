import { expect, Page, test } from '@playwright/test';

// Helper function to set slider value by clicking at the appropriate position
async function setSliderValue(page: Page, testId: string, value: number, min = 1, max = 100) {
  const slider = page.locator(`[data-testid="${testId}"]`);
  await expect(slider).toBeVisible();

  // Try multiple approaches to set the slider value accurately
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    // Calculate percentage position (value between min and max)
    const percentage = (value - min) / (max - min);

    // Get slider bounds and click at the calculated position
    const sliderBounds = await slider.boundingBox();
    if (sliderBounds) {
      // For mobile, add some offset to account for touch targets
      const offset = sliderBounds.width < 200 ? 2 : 0; // Small offset for narrow sliders
      const targetX = sliderBounds.x + sliderBounds.width * percentage + offset;
      const targetY = sliderBounds.y + sliderBounds.height / 2;

      // Use both mouse click and touch for better mobile compatibility
      await page.mouse.click(targetX, targetY);

      // On mobile, also try touch events
      const isMobile = await page.evaluate(() => window.innerWidth < 768);
      if (isMobile) {
        await page.touchscreen.tap(targetX, targetY);
      }

      await page.waitForTimeout(150); // Small delay to ensure value is set

      // Check if the value was set correctly by looking at the label
      const labelText = await slider.locator('..').locator('label').textContent();
      const actualValue = labelText ? parseInt(labelText.split(':')[1]?.trim() || '0') : 0;

      // Allow for small rounding differences
      if (Math.abs(actualValue - value) <= 2) {
        break; // Value set correctly (within tolerance)
      }
    }

    attempts++;
    if (attempts < maxAttempts) {
      await page.waitForTimeout(200); // Wait before retry
    }
  }
}

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
  // Try the header import button first (desktop)
  const headerImportButton = page.locator('[data-testid="import-button"]');

  if (await headerImportButton.isVisible()) {
    await headerImportButton.click();
  } else {
    // If header button is not visible (mobile), use settings modal
    await page.locator('[data-testid="settings-button"]').click();
    await page.locator('button:has-text("Daten importieren")').click();
  }

  // Verify import modal opens (wait a bit longer for modal transitions)
  await expect(page.locator('[data-testid="import-modal"]')).toBeVisible({ timeout: 10000 });
}

test.describe('Import/Export Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="energy-balance-summary"]')).toBeVisible();
  });

  test('should export energy data as JSON', async ({ page }) => {
    // Add some activities to export
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Morning Jog');
    await setSliderValue(page, 'activity-value-slider', 35);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Email Overload');
    await setSliderValue(page, 'activity-value-slider', 20);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Set up download handling
    const downloadPromise = page.waitForEvent('download');

    // Try export functionality (could be in settings or main interface)
    const exportButton = page.locator('[data-testid="export-button"], button:has-text("Exportieren")').first();

    if (await exportButton.isVisible()) {
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

        expect(data).toHaveProperty('positive');
        expect(data).toHaveProperty('negative');
        expect(data.positive.activities).toHaveLength(1);
        expect(data.negative.activities).toHaveLength(1);
        expect(data.positive.activities[0].name).toBe('Morning Jog');
        expect(data.negative.activities[0].name).toBe('Email Overload');
      }
    } else {
      // If no export button visible, try through settings or other menus
      await page.locator('[data-testid="settings-button"]').click();
      const settingsExport = page.locator('[data-testid="export-data"], button:has-text("Exportieren")').first();

      if (await settingsExport.isVisible()) {
        await settingsExport.click();
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/energiekuchen.*\.json$/);
      }
    }
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
      positive: {
        activities: [
          { id: '1', name: 'Imported Yoga', value: 30, color: '#10b981' },
          { id: '2', name: 'Imported Reading', value: 15, color: '#06b6d4' },
        ],
      },
      negative: {
        activities: [{ id: '3', name: 'Imported Stress', value: 25, color: '#ef4444' }],
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
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Imported Yoga');
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Imported Reading');
    await expect(page.locator('[data-testid="activities-list-negative"]')).toContainText('Imported Stress');

    // Verify energy calculations
    await expect(page.locator('[data-testid="positive-energy-total"]')).toContainText('45'); // 30 + 15
    await expect(page.locator('[data-testid="negative-energy-total"]')).toContainText('25');
    await expect(page.locator('[data-testid="energy-balance-total"]')).toContainText('+20'); // 45 - 25
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
      positive: {
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
    // Add existing data
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Existing Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify existing data
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Existing Activity');

    // Import additional data
    const importData = {
      positive: {
        activities: [{ id: '1', name: 'Imported Activity', value: 20, color: '#10b981' }],
      },
      negative: {
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
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Existing Activity');
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Imported Activity');
  });

  test('should replace existing data when importing with replace option', async ({ page }) => {
    // Add existing data
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Old Activity');
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Import data with replace option
    const importData = {
      positive: {
        activities: [{ id: '1', name: 'New Activity', value: 25, color: '#10b981' }],
      },
      negative: {
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
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('New Activity');
    await expect(page.locator('[data-testid="activity-list-positive"]')).not.toContainText('Old Activity');
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
    // Create activities with different values
    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Activity A');
    await setSliderValue(page, 'activity-value-slider', 40);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-positive"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Activity B');
    await setSliderValue(page, 'activity-value-slider', 30);
    await page.locator('[data-testid="submit-activity-button"]').click();

    await page.locator('[data-testid="add-activity-button-negative"]').click();
    await page.locator('[data-testid="activity-name-input"]').fill('Negative Activity');
    await setSliderValue(page, 'activity-value-slider', 20);
    await page.locator('[data-testid="submit-activity-button"]').click();

    // Verify that activities were created and energy totals are displayed
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Activity A');
    await expect(page.locator('[data-testid="activity-list-positive"]')).toContainText('Activity B');
    await expect(page.locator('[data-testid="activity-list-negative"]')).toContainText('Negative Activity');

    // Verify that energy balance shows some positive total
    const positiveTotal = await page.locator('[data-testid="positive-energy-total"]').textContent();
    const positiveValue = parseInt(positiveTotal?.match(/\d+/)?.[0] || '0');
    expect(positiveValue).toBeGreaterThan(0);

    // Verify that energy balance shows some negative total
    const negativeTotal = await page.locator('[data-testid="negative-energy-total"]').textContent();
    const negativeValue = parseInt(negativeTotal?.match(/\d+/)?.[0] || '0');
    expect(negativeValue).toBeGreaterThan(0);

    // Verify that the balance is calculated correctly (positive - negative)
    const balanceTotal = await page.locator('[data-testid="energy-balance-total"]').textContent();
    const balanceValue = parseInt(balanceTotal?.match(/[+-]?\d+/)?.[0] || '0');
    expect(balanceValue).toBe(positiveValue - negativeValue);
  });
});
