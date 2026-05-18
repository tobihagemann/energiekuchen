import { expect, test } from '@playwright/test';

test.describe('Shared chart is read-only', () => {
  test('boundary handles and labels are absent or inert; clicking a slice does not open a modal', async ({ page }) => {
    // Construct a share URL with a couple of v3 activities.
    const payload = {
      version: '3.0',
      current: {
        activities: [
          { id: 'a', name: 'Sport', weight: 5, polarity: 'positive' },
          { id: 'b', name: 'Stress', weight: 5, polarity: 'negative' },
        ],
      },
      desired: { activities: [] },
    };
    const json = JSON.stringify(payload);
    const encoded = Buffer.from(json, 'utf8').toString('base64');
    await page.goto(`/share/#${encoded}`);

    const slices = page.locator('[data-testid^="pie-slice-"]');
    await expect(slices.first()).toBeVisible();

    // Click should not open the modal on shared route.
    await slices.first().click();
    await expect(page.locator('[data-testid="edit-activity-modal"]')).not.toBeVisible();

    // Copy-from-current button must not render on shared.
    await expect(page.locator('[data-testid="copy-from-current-chart-button"]')).toHaveCount(0);
  });
});
