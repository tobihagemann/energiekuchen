import { expect, test } from '@playwright/test';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays correctly on large screens (1920x1080)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Wait for charts section to be visible
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Header should show all navigation items horizontally
    await expect(page.getByTestId('import-button')).toBeVisible();
    await expect(page.getByTestId('share-button')).toBeVisible();
    await expect(page.getByTestId('delete-button')).toBeVisible();

    // Check layout is wide enough for large screens
    const main = page.locator('main');
    const boundingBox = await main.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(1200);
  });

  test('displays correctly on medium screens (800x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 800, height: 1024 });

    // Wait for charts section to be visible
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Header navigation should adapt to medium screen
    await expect(page.getByTestId('import-button')).toBeVisible();
    await expect(page.getByTestId('share-button')).toBeVisible();
    await expect(page.getByTestId('delete-button')).toBeVisible();

    // Check that content adapts to medium width
    const main = page.locator('main');
    const boundingBox = await main.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(800);
    expect(boundingBox?.width).toBeGreaterThanOrEqual(640);
  });

  test('displays correctly on small screens (375x667)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Wait for charts section to be visible
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Navigation should be compact
    await expect(page.getByTestId('logo')).toBeVisible();

    // Check that content fits within small viewport
    const main = page.locator('main');
    const boundingBox = await main.boundingBox();
    expect(boundingBox?.width).toBeLessThan(640);
  });

  test('handles small-medium boundary (640px)', async ({ page }) => {
    // Test just below boundary
    await page.setViewportSize({ width: 639, height: 800 });
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Test at boundary
    await page.setViewportSize({ width: 640, height: 800 });
    await expect(page.getByTestId('charts-section')).toBeVisible();
  });

  test('handles medium-large boundary (1280px)', async ({ page }) => {
    // Test just below boundary
    await page.setViewportSize({ width: 1279, height: 800 });
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Test at boundary
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId('charts-section')).toBeVisible();
  });

  test('handles orientation change on small screens', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Switch to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await expect(page.getByTestId('charts-section')).toBeVisible();

    // Content should adapt to new orientation (now medium size)
    const main = page.locator('main');
    const boundingBox = await main.boundingBox();
    expect(boundingBox?.width).toBeLessThanOrEqual(667);
  });

  test('activity list adapts to different screen sizes', async ({ page }) => {
    // Add some test activities first using the new inline form
    await page.getByTestId('quick-add-input-desired').fill('Test Activity');
    await page.getByTestId('quick-add-button-desired').click();

    // Test on large screen
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.getByTestId('activity-item')).toBeVisible();

    // Test on medium screen
    await page.setViewportSize({ width: 800, height: 1024 });
    await expect(page.getByTestId('activity-item')).toBeVisible();

    // Test on small screen
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.getByTestId('activity-item')).toBeVisible();

    // Activity controls should remain accessible (use more specific selectors)
    await expect(page.locator('[data-testid^="edit-activity-button-"]').first()).toBeVisible();
    await expect(page.locator('[data-testid^="delete-activity-button-"]').first()).toBeVisible();
  });

  test('inline forms adapt to different screen sizes', async ({ page }) => {
    // Test inline quick add form on different sizes
    const screenSizes = [
      { width: 1920, height: 1080 }, // Large
      { width: 800, height: 1024 }, // Medium
      { width: 375, height: 667 }, // Small
    ];

    for (const size of screenSizes) {
      await page.setViewportSize(size);

      // Inline form elements should be visible and properly sized
      await expect(page.getByTestId('quick-add-input-current')).toBeVisible();
      await expect(page.getByTestId('quick-add-button-current')).toBeVisible();

      // Input and button should not exceed viewport
      const inputBox = await page.getByTestId('quick-add-input-current').boundingBox();
      expect(inputBox?.width).toBeLessThanOrEqual(size.width);
    }
  });

  test('modals adapt to different screen sizes', async ({ page }) => {
    // Test modal responsiveness on different screen sizes
    const screenSizes = [
      { width: 1920, height: 1080 }, // Large
      { width: 800, height: 1024 }, // Medium
      { width: 375, height: 667 }, // Small
    ];

    for (const size of screenSizes) {
      await page.setViewportSize(size);

      // Test share modal
      await page.getByTestId('share-button').click();

      // Modal should be visible and properly sized
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      const modalBox = await modal.boundingBox();
      // Allow small tolerance for scrollbars and browser rendering differences
      expect(modalBox?.width).toBeLessThanOrEqual(size.width + 5);
      expect(modalBox?.height).toBeLessThanOrEqual(size.height + 5);

      // Close modal
      await page.keyboard.press('Escape');
      await expect(modal).not.toBeVisible();
    }
  });

  test('navigation is accessible on touch devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    // Import button is visible on small screens
    await expect(page.getByTestId('import-button')).toBeVisible();

    // Test touch interactions with visible header buttons
    await expect(page.getByTestId('share-button')).toBeVisible();
    await page.getByTestId('share-button').click();

    // Share modal should open
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close modal by pressing escape
    await page.keyboard.press('Escape');
  });

  test('charts are responsive', async ({ page }) => {
    // Add some test data first using the new inline form
    await page.getByTestId('quick-add-input-desired').fill('Test Activity');
    await page.getByTestId('quick-add-button-desired').click();

    const screenSizes = [
      { width: 1920, height: 1080, expectedChartSize: 440 }, // Large
      { width: 800, height: 1024, expectedChartSize: 360 }, // Medium
      { width: 375, height: 667, expectedChartSize: 280 }, // Small
    ];

    for (const { width, height } of screenSizes) {
      await page.setViewportSize({ width, height });

      // Charts section should be visible
      await expect(page.getByTestId('charts-section')).toBeVisible();

      // Charts should adapt to container width
      const chartsSection = page.getByTestId('charts-section');
      const chartsBoundingBox = await chartsSection.boundingBox();
      expect(chartsBoundingBox?.width).toBeLessThanOrEqual(width);
    }
  });

  test('text remains readable at different zoom levels', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Test different zoom levels
    const zoomLevels = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

    for (const zoom of zoomLevels) {
      await page.evaluate(zoomLevel => {
        document.body.style.zoom = zoomLevel.toString();
      }, zoom);

      // Charts section should remain visible and readable
      await expect(page.getByTestId('charts-section')).toBeVisible();

      // Navigation should remain functional
      await expect(page.getByTestId('logo')).toBeVisible();
    }

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '1';
    });
  });

  test('handles very small screens gracefully', async ({ page }) => {
    // Test extremely small viewport (like smartwatch)
    await page.setViewportSize({ width: 280, height: 280 });

    // Essential elements should still be accessible
    await expect(page.getByTestId('logo')).toBeVisible();

    // Content should not cause horizontal scrolling
    const body = page.locator('body');
    const bodyBox = await body.boundingBox();
    expect(bodyBox?.width).toBeLessThanOrEqual(280);

    // Inline form should remain functional even if compact
    await expect(page.getByTestId('quick-add-input-desired')).toBeVisible();
  });
});
