import { expect, test, type Page } from '@playwright/test';

import { seedCurrent, slicePct } from './chart-helpers';

// Reordering the activity list re-emits the animated entries in the new order. This guards
// the slices[i] ↔ animatedEntries[i] index coupling and the id-based boundary-handle wiring
// in EnergyChart against an order/index desync on the first reorder frame.

// Scope to the sortable list container: the dnd-kit DragOverlay renders a clone of the
// dragged item (same testid) outside this container during the drop animation.
function listOrder(page: Page): Promise<string[]> {
  return page
    .locator('[data-testid="activities-list-current"] [data-testid^="activity-item-"]')
    .evaluateAll(items => items.map(i => i.getAttribute('data-testid')!.replace('activity-item-', '')));
}

test.describe('Chart reorder id coupling', () => {
  test('a drag-reorder keeps each slice and boundary handle bound to its own activity id', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();

    // Distinct weights → distinct, recognizable percentages per name (60 / 30 / 10).
    await seedCurrent(page, [
      { id: 'a', name: 'A', weight: 6, polarity: 'positive' },
      { id: 'b', name: 'B', weight: 3, polarity: 'positive' },
      { id: 'c', name: 'C', weight: 1, polarity: 'positive' },
    ]);
    await expect(page.locator('[data-testid^="pie-slice-"]')).toHaveCount(3, { timeout: 5000 });

    // Move A down via the dnd-kit keyboard sensor: focus its drag handle, pick up, step
    // down, drop. Settle waits between presses keep the move count deterministic.
    const dragHandle = page.locator('[data-testid="activity-item-a"] button').first();
    await dragHandle.focus();
    await page.keyboard.press('Space');
    await page.waitForTimeout(100);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(100);
    await page.keyboard.press('Space');

    // The order changed (A is no longer first); read the actual resulting permutation so the
    // id-coupling assertions below don't depend on exactly how many positions the move landed.
    await expect.poll(() => listOrder(page)).not.toEqual(['a', 'b', 'c']);
    const order = await listOrder(page);
    expect(order).toHaveLength(3);

    // Each named slice still shows its own (unchanged) share — a slices[i] ↔ entries[i]
    // desync would surface as a slice carrying a neighbor's percentage. Poll past the 150ms.
    await expect.poll(() => slicePct(page, 'A')).toBe(60);
    await expect.poll(() => slicePct(page, 'B')).toBe(30);
    await expect.poll(() => slicePct(page, 'C')).toBe(10);

    // Boundary handles are wired by id to the reordered ring: each receiver pairs with the
    // next id around the ring.
    for (let i = 0; i < order.length; i++) {
      const receiver = order[i];
      const donor = order[(i + 1) % order.length];
      await expect(page.locator(`[data-testid="pie-boundary-handle-${receiver}-${donor}"]`)).toBeAttached();
    }
  });
});
