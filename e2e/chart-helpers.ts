import { expect, type Page } from '@playwright/test';

// Shared helpers for the chart specs (keyboard, reorder).

export async function seedCurrent(page: Page, activities: Array<{ id: string; name: string; weight: number; polarity: 'positive' | 'negative' }>) {
  await page.evaluate(
    payload => {
      localStorage.setItem('energiekuchen-data', JSON.stringify(payload));
    },
    { version: '3.0', current: { activities }, desired: { activities: [] } }
  );
  await page.reload();
  await expect(page.locator('[data-testid="charts-section"]')).toBeVisible();
}

// Slice paths carry role="button" and an aria-label of `${name}, ${pct} %, ${polarity}`.
// Match on the aria-label prefix so the lookup is independent of the (UUID) slice id.
export function sliceByName(page: Page, name: string) {
  return page.locator(`[data-testid="energy-chart-current"] [data-testid^="pie-slice-"][aria-label^="${name},"]`);
}

export async function slicePct(page: Page, name: string): Promise<number> {
  const label = await sliceByName(page, name).getAttribute('aria-label');
  const match = label?.match(/,\s*(\d+)\s*%/);
  if (!match) throw new Error(`no percentage in aria-label: ${label}`);
  return Number(match[1]);
}
