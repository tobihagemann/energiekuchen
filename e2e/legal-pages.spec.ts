import { expect, test } from '@playwright/test';

test.describe('Legal Pages', () => {
  test('impressum page should have working navigation', async ({ page }) => {
    await page.goto('/impressum');

    // Check that the page loads
    await expect(page.getByRole('heading', { name: 'Impressum' })).toBeVisible();

    // Check that the LegalHeader is present
    const header = page.getByTestId('header');
    await expect(header).toBeVisible();

    // Check that the "Zurück zur App" button is in the navbar
    // On mobile, only the icon is visible
    const backButton = header.getByRole('link').filter({ has: page.getByRole('button') });
    await expect(backButton).toBeVisible();

    // Click the back button and verify navigation
    await backButton.click();
    await expect(page).toHaveURL('/');

    // Verify no modals are open
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('datenschutz page should have working navigation', async ({ page }) => {
    await page.goto('/datenschutz');

    // Check that the page loads
    await expect(page.getByRole('heading', { name: 'Datenschutzerklärung', exact: true })).toBeVisible();

    // Check that the LegalHeader is present
    const header = page.getByTestId('header');
    await expect(header).toBeVisible();

    // Check that the "Zurück zur App" button is in the navbar
    // On mobile, only the icon is visible
    const backButton = header.getByRole('link').filter({ has: page.getByRole('button') });
    await expect(backButton).toBeVisible();

    // Click the back button and verify navigation
    await backButton.click();
    await expect(page).toHaveURL('/');

    // Verify no modals are open
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('navigation buttons on legal pages should not open modals', async ({ page }) => {
    await page.goto('/impressum');

    // Verify that there are no action buttons that would open modals
    const header = page.getByTestId('header');
    await expect(header.getByTestId('import-button')).not.toBeVisible();
    await expect(header.getByTestId('share-button')).not.toBeVisible();
    await expect(header.getByTestId('delete-button')).not.toBeVisible();

    // Navigate back to main page and verify modals are not automatically opened
    await header
      .getByRole('link')
      .filter({ has: page.getByRole('button') })
      .click();
    await expect(page).toHaveURL('/');

    // Wait a moment to ensure no modals appear
    await page.waitForTimeout(500);
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});
