import { expect, test, type Page } from '@playwright/test';

import { seedCurrent, sliceByName, slicePct } from './chart-helpers';

function announcer(page: Page) {
  return page.locator('[data-testid="chart-announcer-current"]');
}

async function addPositive(page: Page, name: string) {
  await page.locator('[data-testid="quick-add-input-positive-current"]').fill(name);
  await page.locator('[data-testid="quick-add-button-positive-current"]').click();
}

test.describe('Chart keyboard interactions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
  });

  test('every slice is a tab stop', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('A');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('B');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();

    const slices = page.locator('[data-testid^="pie-slice-"]');
    await expect(slices).toHaveCount(2, { timeout: 5000 });
    const firstSlice = slices.first();
    await firstSlice.focus();
    await expect(firstSlice).toBeFocused();
  });

  test('Space opens the edit modal on the focused slice', async ({ page }) => {
    await page.locator('[data-testid="quick-add-input-positive-current"]').fill('Sport');
    await page.locator('[data-testid="quick-add-button-positive-current"]').click();
    const slice = page.locator('[data-testid^="pie-slice-"]').first();
    await slice.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-testid="edit-activity-modal"]')).toBeVisible();
  });

  test('ArrowRight redistributes weight from the clockwise neighbor into the focused slice', async ({ page }) => {
    // Three equal slices (A, B, C) at 33% each. ArrowRight on A pulls a 1%-of-total step
    // from the clockwise neighbor B (index+1), nudging A up and B down past an integer.
    for (const name of ['A', 'B', 'C']) await addPositive(page, name);
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(3, { timeout: 5000 });

    await sliceByName(page, 'A').focus();
    await page.keyboard.press('ArrowRight');

    await expect(announcer(page)).toHaveText(/A: \d+ %/);
    // Poll past the 150ms redistribution animation before reading the settled shares.
    await expect.poll(() => slicePct(page, 'A')).toBeGreaterThan(33);
    await expect.poll(() => slicePct(page, 'B')).toBeLessThan(33);
    await expect.poll(() => slicePct(page, 'C')).toBe(33);
  });

  test('ArrowLeft redistributes weight from the counter-clockwise neighbor', async ({ page }) => {
    // Same setup; ArrowLeft on A pulls from the counter-clockwise neighbor C (index-1).
    for (const name of ['A', 'B', 'C']) await addPositive(page, name);
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(3, { timeout: 5000 });

    await sliceByName(page, 'A').focus();
    await page.keyboard.press('ArrowLeft');

    await expect(announcer(page)).toHaveText(/A: \d+ %/);
    // Poll past the 150ms redistribution animation before reading the settled shares.
    await expect.poll(() => slicePct(page, 'A')).toBeGreaterThan(33);
    await expect.poll(() => slicePct(page, 'C')).toBeLessThan(33);
    await expect.poll(() => slicePct(page, 'B')).toBe(33);
  });

  test('Shift+Arrow moves the focused slice label', async ({ page }) => {
    await addPositive(page, 'A');
    await addPositive(page, 'B');
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(2, { timeout: 5000 });

    await sliceByName(page, 'A').focus();
    await page.keyboard.press('Shift+ArrowUp');

    await expect(announcer(page)).toHaveText('Label verschoben');
  });

  test('Escape resets a moved label, and is a no-op when there is no offset', async ({ page }) => {
    await addPositive(page, 'A');
    await addPositive(page, 'B');
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(2, { timeout: 5000 });

    // Move the label, then Escape resets it.
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('Shift+ArrowUp');
    await expect(announcer(page)).toHaveText('Label verschoben');
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('Escape');
    await expect(announcer(page)).toHaveText('Label zurückgesetzt');

    // Set a distinct sentinel via a real redistribution, then Escape with no offset must
    // not change it (the announcer keeps its last text rather than re-emitting).
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('ArrowRight');
    await expect(announcer(page)).toHaveText(/A: \d+ %/);
    const sentinel = await announcer(page).textContent();
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200); // past the 100ms announce debounce
    await expect(announcer(page)).toHaveText(sentinel ?? '');
  });

  test('redistribution toward a floored donor is a verified no-op', async ({ page }) => {
    // A holds 99% and B sits at the 1%-of-total floor. ArrowRight on A would pull from B,
    // but the donor is already at the floor, so the handler returns without redistributing.
    await seedCurrent(page, [
      { id: 'a', name: 'A', weight: 99, polarity: 'positive' },
      { id: 'b', name: 'B', weight: 1, polarity: 'positive' },
    ]);
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(2, { timeout: 5000 });
    // Poll past the grow-in animation so A has settled at its 99% share.
    await expect.poll(() => slicePct(page, 'A')).toBe(99);

    // Set a distinct sentinel announcement first (a successful label move on A).
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('Shift+ArrowUp');
    await expect(announcer(page)).toHaveText('Label verschoben');

    // The no-op press toward the floored donor must neither announce nor change A's share.
    await sliceByName(page, 'A').focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200); // past the 100ms announce debounce
    await expect(announcer(page)).toHaveText('Label verschoben');
    expect(await slicePct(page, 'A')).toBe(99);
  });
});
