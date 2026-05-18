import { expect, test } from '@playwright/test';

test.describe('Chart boundary drag', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('boundary handle is rendered when chart has 2+ activities', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('A');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('B');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const handles = page.locator('[data-testid^="pie-boundary-handle-"]');
    await expect(handles.first()).toBeAttached({ timeout: 5000 });
  });

  test('boundary cursor matches divider orientation', async ({ page }) => {
    // Four equal slices place dividers at the four cardinal radii: two vertical
    // (top/bottom of the rim → ew-resize) and two horizontal (left/right → ns-resize).
    for (const name of ['A', 'B', 'C', 'D']) {
      await page.locator('[data-testid="quick-add-input-positive-current"]').fill(name);
      await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    }

    const cursors = await page.locator('[data-testid^="pie-boundary-handle-"]').evaluateAll(handles => handles.map(h => (h as SVGGElement).style.cursor));
    expect(cursors.filter(c => c === 'ew-resize')).toHaveLength(2);
    expect(cursors.filter(c => c === 'ns-resize')).toHaveLength(2);
  });

  test('boundary cursor uses diagonal variants for off-axis dividers', async ({ page }) => {
    // Three equal slices place dividers at angles -π/2 (top, vertical line → ew-resize
    // because drag direction is horizontal), π/6 (≈30°, NW-SE line dragged along NE-SW
    // → nesw-resize), and 5π/6 (≈150°, NE-SW line dragged along NW-SE → nwse-resize).
    for (const name of ['A', 'B', 'C']) {
      await page.locator('[data-testid="quick-add-input-positive-current"]').fill(name);
      await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    }

    const cursors = await page.locator('[data-testid^="pie-boundary-handle-"]').evaluateAll(handles => handles.map(h => (h as SVGGElement).style.cursor));
    expect(cursors.filter(c => c === 'ew-resize')).toHaveLength(1);
    expect(cursors.filter(c => c === 'nesw-resize')).toHaveLength(1);
    expect(cursors.filter(c => c === 'nwse-resize')).toHaveLength(1);
  });

  test('boundary indicator only appears on hover', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('A');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('B');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const handle = page.locator('[data-testid^="pie-boundary-handle-"]').first();
    await expect(handle).toBeAttached();
    // No indicator before hover — only the transparent hit rect is rendered.
    expect(await handle.locator('rect').count()).toBe(1);
    await handle.hover();
    // Hover adds the visible indicator rect on top of the hit rect.
    await expect(handle.locator('rect')).toHaveCount(2);
  });
});
