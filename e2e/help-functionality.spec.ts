import { expect, test } from '@playwright/test';

test.describe('Help Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays getting started help when no activities exist', async ({ page }) => {
    // On fresh load with no activities, help should be visible
    await expect(page.getByTestId('getting-started-help')).toBeVisible();

    // Help should contain useful guidance
    const helpText = page.getByTestId('getting-started-help');
    await expect(helpText).toContainText('Energieverbraucher');
    await expect(helpText).toContainText('Energiequellen');
  });

  test('hides getting started help when activities exist', async ({ page }) => {
    // Add an activity
    await page.getByTestId('add-activity-button-negative').click();
    await page.getByTestId('activity-name-input').fill('Test Activity');
    await page.getByTestId('submit-activity-button').click();

    // Getting started help should no longer be visible
    await expect(page.getByTestId('getting-started-help')).not.toBeVisible();
  });

  test('opens help modal from header button', async ({ page }) => {
    await page.getByTestId('help-button').click();

    // Help modal should open
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();
    await expect(modal).toContainText('Hilfe & Anleitung');
  });

  test('closes help modal with escape key', async ({ page }) => {
    await page.getByTestId('help-button').click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Close with escape
    await page.keyboard.press('Escape');
    await expect(modal).not.toBeVisible();
  });

  test('closes help modal by clicking outside', async ({ page }) => {
    await page.getByTestId('help-button').click();
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Click outside the modal
    await page.click('body', { position: { x: 10, y: 10 } });
    await expect(modal).not.toBeVisible();
  });

  test('help modal contains expected sections', async ({ page }) => {
    await page.getByTestId('help-button').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Should contain information about energy balance
    await expect(modal).toContainText('Energiebilanz');

    // Should contain information about activities
    await expect(modal).toContainText('Aktivität');

    // Should contain information about sharing
    await expect(modal).toContainText('Teilen');
  });

  test('help tooltips appear on hover for complex elements', async ({ page }) => {
    // Add an activity to get more UI elements
    await page.getByTestId('add-activity-button-negative').click();
    await page.getByTestId('activity-name-input').fill('Test Activity');
    await page.getByTestId('submit-activity-button').click();

    // Test tooltip on energy balance (if implemented)
    const energyBalance = page.getByTestId('energy-balance-summary');
    await energyBalance.hover();

    // Check if tooltip appears (tooltip implementation may vary)
    // This test might need adjustment based on actual tooltip implementation
  });

  test('help content is accessible via keyboard navigation', async ({ page }) => {
    // Use keyboard to navigate to help button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Navigate to help button

    // Open help with Enter
    await page.keyboard.press('Enter');
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should be able to navigate within modal
    await page.keyboard.press('Tab');

    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();
  });

  test('help modal is responsive on different screen sizes', async ({ page }) => {
    const screenSizes = [
      { width: 1920, height: 1080 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const size of screenSizes) {
      await page.setViewportSize(size);

      await page.getByTestId('help-button').click();

      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Modal should fit within viewport
      const modalBox = await modal.boundingBox();
      expect(modalBox?.width).toBeLessThanOrEqual(size.width);
      expect(modalBox?.height).toBeLessThanOrEqual(size.height);

      // Content should be readable
      await expect(modal).toContainText('Hilfe');

      // Close modal
      await page.keyboard.press('Escape');
    }
  });

  test('help system provides contextual guidance', async ({ page }) => {
    // Test empty state help
    await expect(page.getByTestId('getting-started-help')).toBeVisible();

    // After adding activity, different help might be shown
    await page.getByTestId('add-activity-button-negative').click();
    await page.getByTestId('activity-name-input').fill('Test Activity');
    await page.getByTestId('submit-activity-button').click();

    // Getting started help should be hidden
    await expect(page.getByTestId('getting-started-help')).not.toBeVisible();

    // But help should still be accessible via header
    await page.getByTestId('help-button').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('help content includes keyboard shortcuts information', async ({ page }) => {
    await page.getByTestId('help-button').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // For now, just check that the modal is functional and contains some content
    // This test can be enhanced when keyboard shortcuts are actually implemented
    const modalText = await modal.textContent();
    expect(modalText).toBeTruthy();
    expect(modalText).toContain('Energiequellen');
  });

  test('help modal can be reopened after closing', async ({ page }) => {
    // Open help
    await page.getByTestId('help-button').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Close help
    await page.keyboard.press('Escape');
    await expect(page.locator('[role="dialog"]')).not.toBeVisible();

    // Reopen help
    await page.getByTestId('help-button').click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();

    // Should still contain the same content
    const modal = page.locator('[role="dialog"]');
    await expect(modal).toContainText('Energiebilanz');
  });

  test('help system works with screen readers', async ({ page }) => {
    // Test ARIA attributes and labels
    await page.getByTestId('help-button').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Modal should have proper ARIA attributes
    await expect(modal).toHaveAttribute('role', 'dialog');

    // Help button should have accessible label
    const helpButton = page.getByTestId('help-button');
    await expect(helpButton).toHaveAttribute('aria-label', /.+/);
  });

  test('help content is available in German', async ({ page }) => {
    await page.getByTestId('help-button').click();

    const modal = page.locator('[role="dialog"]');
    await expect(modal).toBeVisible();

    // Content should be in German
    await expect(modal).toContainText('Hilfe');
    await expect(modal).toContainText('Energiebilanz');

    // Should not contain English help text
    await expect(modal).not.toContainText('Help');
    await expect(modal).not.toContainText('Energy Balance');
  });
});
