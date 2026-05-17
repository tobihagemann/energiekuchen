import { renderHook } from '@testing-library/react';

import { RenderedEntry, useChartData } from '@/app/lib/hooks/useChartData';
import { NEGATIVE_COLOR, POSITIVE_COLOR } from '@/app/lib/utils/constants';

function makeRendered(entries: Array<Partial<RenderedEntry>>): RenderedEntry[] {
  return entries.map((e, i) => ({
    id: e.id ?? `${i}`,
    name: e.name ?? `Activity ${i}`,
    weight: e.weight ?? 1,
    polarity: e.polarity ?? 'positive',
    details: e.details,
    labelOffset: e.labelOffset,
  }));
}

const baseInput = {
  labelBBoxes: {},
  editingActivity: null,
  chartType: 'current' as const,
  chartSize: 360,
};

describe('useChartData (SVG geometry)', () => {
  test('empty chart returns a single full-circle slice in gray', () => {
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: [],
        displayedWeights: [],
        displayedOffsets: [],
      })
    );
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.slices).toHaveLength(1);
    expect(result.current.slices[0].fillColor).toBe('oklch(0.967 0.003 264.542)');
    expect(result.current.labels).toEqual([]);
  });

  test('multi-slice angles sum to 2π', () => {
    const entries = makeRendered([
      { id: 'a', weight: 3, polarity: 'positive' },
      { id: 'b', weight: 6, polarity: 'positive' },
      { id: 'c', weight: 3, polarity: 'negative' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [3, 6, 3],
        displayedOffsets: [undefined, undefined, undefined],
      })
    );
    const total = result.current.slices.reduce((s, slice) => s + (slice.endAngle - slice.startAngle), 0);
    expect(total).toBeCloseTo(Math.PI * 2);
  });

  test('renders polarity colors', () => {
    const entries = makeRendered([
      { id: 'a', weight: 5, polarity: 'positive' },
      { id: 'b', weight: 5, polarity: 'negative' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5, 5],
        displayedOffsets: [undefined, undefined],
      })
    );
    expect(result.current.slices[0].fillColor).toBe(POSITIVE_COLOR);
    expect(result.current.slices[1].fillColor).toBe(NEGATIVE_COLOR);
  });

  test('darkens border for active editing slice', () => {
    const entries = makeRendered([
      { id: 'a', weight: 5, polarity: 'positive' },
      { id: 'b', weight: 5, polarity: 'positive' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5, 5],
        displayedOffsets: [undefined, undefined],
        editingActivity: { chartType: 'current', activityId: 'a' },
      })
    );
    expect(result.current.slices[0].borderColor).toBe(`oklch(from ${POSITIVE_COLOR} calc(l - 0.1) c h)`);
    expect(result.current.slices[1].borderColor).toBe('oklch(1 0 0)');
  });

  test('single activity emits a non-degenerate full-circle path', () => {
    const entries = makeRendered([{ id: 'a', weight: 5, polarity: 'positive' }]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5],
        displayedOffsets: [undefined],
      })
    );
    expect(result.current.slices[0].isFullCircle).toBe(true);
    expect(result.current.slices[0].pathD).toMatch(/^M /);
    expect(result.current.slices[0].pathD).toMatch(/A /);
  });

  test('label leader-line is null when label sits near the centroid', () => {
    const entries = makeRendered([
      { id: 'a', weight: 5, polarity: 'positive' },
      { id: 'b', weight: 5, polarity: 'positive' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5, 5],
        displayedOffsets: [undefined, undefined],
      })
    );
    expect(result.current.labels[0].leaderTo).toBeNull();
  });

  test('label leader-line is set when offset pushes label past the threshold', () => {
    const entries = makeRendered([
      { id: 'a', weight: 5, polarity: 'positive' },
      { id: 'b', weight: 5, polarity: 'positive' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5, 5],
        displayedOffsets: [{ radial: 0.4, angular: 0 }, undefined],
      })
    );
    expect(result.current.labels[0].leaderTo).not.toBeNull();
  });

  test('layout includes 20% padding around the pie radius', () => {
    const entries = makeRendered([{ id: 'a', weight: 5, polarity: 'positive' }]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: [5],
        displayedOffsets: [undefined],
        chartSize: 360,
      })
    );
    expect(result.current.layout.radius).toBe(180);
    expect(result.current.layout.sizePx).toBeCloseTo(360 * 1.2);
    expect(result.current.layout.viewBox).toBe('-216 -216 432 432');
  });

  test('memoizes on stable input', () => {
    const entries = makeRendered([{ id: 'a', weight: 5, polarity: 'positive' }]);
    const weights = [5];
    const offsets = [undefined];
    const { result, rerender } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        displayedWeights: weights,
        displayedOffsets: offsets,
      })
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
