import { expect, Page, test } from '@playwright/test';

async function seedActivities(page: Page) {
  await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Yoga');
  await page.locator('[data-testid="quick-add-button-positive-current"]').click();

  await page.locator('[data-testid="quick-add-input-negative-current"]').fill('Pendeln');
  await page.locator('[data-testid="quick-add-button-negative-current"]').click();

  await page.locator('[data-testid="quick-add-input-positive-desired"]').fill('Schlaf');
  await page.locator('[data-testid="quick-add-button-positive-desired"]').click();
}

async function openExportModal(page: Page) {
  await page.locator('[data-testid="export-modal-button"]').click();
  await expect(page.locator('[data-testid="export-modal"]')).toBeVisible({ timeout: 10000 });
}

// Decode a downloaded PNG inside the browser (no native canvas in Node, no decoder dependency)
// and return basic pixel statistics.
async function decodePng(page: Page, base64: string) {
  return page.evaluate(async (b64: string) => {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('decode failed'));
      image.src = `data:image/png;base64,${b64}`;
    });
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(image, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let coloredPixels = 0;
    let darkPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a === 0) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      // Saturated pixels can only come from the green/red oklch slice fills.
      if (max - min > 40) coloredPixels++;
      // Near-black pixels can only come from gray-900 <text> (titles, labels, wordmark).
      if (r < 60 && g < 60 && b < 60) darkPixels++;
    }
    return { width: canvas.width, height: canvas.height, coloredPixels, darkPixels };
  }, base64);
}

test.describe('Image & JSON Export', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('renders a foreignObject-free export SVG with native label text', async ({ page }) => {
    await seedActivities(page);
    await openExportModal(page);

    const exportSvg = page.locator('[data-testid="energiekuchen-export-svg"]');
    await expect(exportSvg).toBeVisible();

    // The export renderer must NOT reuse the live foreignObject labels (they blank out on raster).
    await expect(exportSvg.locator('foreignObject')).toHaveCount(0);

    // Titles and the activity name render as native <text>.
    await expect(exportSvg).toContainText('Ist-Zustand');
    await expect(exportSvg).toContainText('Wunsch-Zustand');
    await expect(exportSvg).toContainText('Yoga');
    await expect(exportSvg).toContainText('Energiekuchen');
    await expect(exportSvg).toContainText('energiekuchen.de');
  });

  test('downloads a PNG whose pixels carry slice colors and label text', async ({ page }) => {
    await seedActivities(page);
    await openExportModal(page);

    const imageButton = page.locator('[data-testid="export-image-button"]');
    await expect(imageButton).toBeEnabled({ timeout: 10000 });

    const downloadPromise = page.waitForEvent('download');
    await imageButton.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/energiekuchen.*\.png$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import('fs');
    const base64 = fs.readFileSync(path!).toString('base64');
    const stats = await decodePng(page, base64);

    // Intrinsic export size is 880×556, rasterized at scale 2.
    expect(stats.width).toBeGreaterThanOrEqual(1700);
    expect(stats.height).toBeGreaterThanOrEqual(1000);
    // Slices (oklch green/red) survived the SVG→canvas path.
    expect(stats.coloredPixels).toBeGreaterThan(500);
    // Native <text> (titles + labels + wordmark) rasterized instead of blanking out.
    expect(stats.darkPixels).toBeGreaterThan(200);
  });

  test('exports JSON from the export modal', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Morning Jog');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    await openExportModal(page);

    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-testid="export-button"]').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/energiekuchen.*\.json$/);

    const path = await download.path();
    expect(path).toBeTruthy();
    const fs = await import('fs');
    const data = JSON.parse(fs.readFileSync(path!, 'utf8'));
    expect(data).toHaveProperty('current');
    expect(data.current.activities[0].name).toBe('Morning Jog');
  });

  test('disables the image button when both charts are empty', async ({ page }) => {
    await openExportModal(page);

    await expect(page.locator('[data-testid="export-image-button"]')).toBeDisabled();
    // JSON export stays available regardless.
    await expect(page.locator('[data-testid="export-button"]')).toBeEnabled();
    // No preview is rendered for an empty export.
    await expect(page.locator('[data-testid="energiekuchen-export-svg"]')).toHaveCount(0);
  });
});
