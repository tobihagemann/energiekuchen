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
  draggedLabelId: null,
};

describe('useChartData (SVG geometry)', () => {
  test('empty chart returns a single full-circle slice in gray', () => {
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: [],
      })
    );
    expect(result.current.isEmpty).toBe(true);
    expect(result.current.slices).toHaveLength(1);
    expect(result.current.slices[0].fillColor).toBe('oklch(0.967 0.003 264.542)');
    expect(result.current.labels).toEqual([]);
  });

  test('slices walk contiguously from the start angle and pass weights through', () => {
    const entries = makeRendered([
      { id: 'a', weight: 3, polarity: 'positive' },
      { id: 'b', weight: 6, polarity: 'positive' },
      { id: 'c', weight: 3, polarity: 'negative' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
      })
    );
    const slices = result.current.slices;
    // Weights 3/6/3 of 12 give sweeps of π/2, π, π/2; walking from the fixed start angle
    // (-π/2) the cumulative endAngles land at 0, π, and 3π/2 (= start + 2π).
    const startAngle = -Math.PI / 2;
    expect(slices.map(s => s.weight)).toEqual([3, 6, 3]);
    expect(slices[0].endAngle).toBeCloseTo(startAngle + Math.PI / 2);
    expect(slices[1].endAngle).toBeCloseTo(startAngle + Math.PI / 2 + Math.PI);
    expect(slices[2].endAngle).toBeCloseTo(startAngle + Math.PI * 2);
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
      })
    );
    // The full-circle path is two arcs with no line-to-center command, unlike a wedge's
    // "M cx cy L …" path — confirming the single slice renders as a full circle.
    expect(result.current.slices[0].pathD).toMatch(/^M /);
    expect(result.current.slices[0].pathD).toMatch(/A /);
    expect(result.current.slices[0].pathD).not.toMatch(/L /);
  });

  test('label leader-line is null when label stays inside the circle', () => {
    const entries = makeRendered([
      { id: 'a', weight: 5, polarity: 'positive' },
      { id: 'b', weight: 5, polarity: 'positive' },
    ]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
      })
    );
    expect(result.current.labels[0].isOutside).toBe(false);
    expect(result.current.labels[0].leaderTo).toBeNull();
  });

  test('label leader-line terminates at the slice arc midpoint when label is dragged outside', () => {
    const entries = makeRendered([
      { id: 'a', name: 'A', weight: 5, polarity: 'positive', labelOffset: { radial: 0.6, angular: 0 } },
      { id: 'b', name: 'B', weight: 5, polarity: 'positive' },
    ]);
    // radial: 0.6 → past the radius — outside the circle. Small bbox keeps the constraint
    // from clamping back inside on a 360px chart.
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        labelBBoxes: { a: { w: 15, h: 16 } },
      })
    );
    const label = result.current.labels[0];
    const radius = result.current.layout.radius;
    expect(label.isOutside).toBe(true);
    expect(label.leaderTo).not.toBeNull();
    // Two equal slices starting at -π/2 → first slice spans [-π/2, π/2], midAngle = 0,
    // so the leader endpoint sits at (radius, 0).
    expect(label.leaderTo!.x).toBeCloseTo(radius, 5);
    expect(label.leaderTo!.y).toBeCloseTo(0, 5);
    // leaderFrom is the start of the connector at the bbox edge plus a small gap; it must
    // be present whenever leaderTo is, and must sit between the label and leaderTo. Here
    // the label sits outside the circle on the +x side, so leaderFrom is between
    // leaderTo (on the circle) and the label.
    expect(label.leaderFrom).not.toBeNull();
    expect(label.leaderFrom!.x).toBeLessThan(label.x);
    expect(label.leaderFrom!.x).toBeGreaterThan(label.leaderTo!.x);
  });

  test('layout includes 20% padding around the pie radius', () => {
    const entries = makeRendered([{ id: 'a', weight: 5, polarity: 'positive' }]);
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        chartSize: 360,
      })
    );
    expect(result.current.layout.radius).toBe(180);
    expect(result.current.layout.sizePx).toBeCloseTo(360 * 1.2);
    expect(result.current.layout.viewBox).toBe('-216 -216 432 432');
  });

  test('label bbox is constrained to its slice wedge', () => {
    // Slice 'a' (weight 1 of 10) spans [-π/2, -3π/10]. A tangential offset that would
    // place the label past the wedge gets projected back so the bbox fits in the wedge.
    // angular = +π pushes label half-circle away from its slice's midAxis.
    const entries = makeRendered([
      { id: 'a', name: 'A', weight: 1, polarity: 'positive', labelOffset: { radial: 0, angular: Math.PI } },
      { id: 'b', name: 'B', weight: 9, polarity: 'positive' },
    ]);
    const aBBox = { w: 15, h: 16 };
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        labelBBoxes: { a: aBBox, b: { w: 15, h: 16 } },
      })
    );
    const labelA = result.current.labels.find(l => l.id === 'a')!;
    // Verify the bbox fits in slice 'a's wedge — half-plane test for both radial edges.
    const startAngle = -Math.PI / 2;
    const endAngle = -Math.PI / 2 + (2 * Math.PI) / 10;
    const nStart = { x: -Math.sin(startAngle), y: Math.cos(startAngle) };
    const nEnd = { x: Math.sin(endAngle), y: -Math.cos(endAngle) };
    const reqStart = Math.abs(nStart.x) * (aBBox.w / 2) + Math.abs(nStart.y) * (aBBox.h / 2);
    const reqEnd = Math.abs(nEnd.x) * (aBBox.w / 2) + Math.abs(nEnd.y) * (aBBox.h / 2);
    expect(nStart.x * labelA.x + nStart.y * labelA.y).toBeGreaterThanOrEqual(reqStart - 1e-3);
    expect(nEnd.x * labelA.x + nEnd.y * labelA.y).toBeGreaterThanOrEqual(reqEnd - 1e-3);
  });

  test('at max chart density (20 equal slices), every label stays inside the viewBox', () => {
    // 20 is the documented chart maximum (see VALIDATION_RULES.chart.maxActivities in
    // validation.ts) and the densest case the outer-label nudge is sized for. Verify the
    // pipeline (constrain + nudge) keeps every label fully inside the viewBox at that
    // density on a small chart where outer labels are tightest.
    const entries = makeRendered(
      Array.from({ length: 20 }, (_, i) => ({
        id: `a${i}`,
        name: `Aktivität ${i + 1}`,
        weight: 1,
        polarity: (i % 2 === 0 ? 'positive' : 'negative') as 'positive' | 'negative',
      }))
    );
    const bboxes = Object.fromEntries(entries.map(e => [e.id, { w: 70, h: 18 }]));
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        labelBBoxes: bboxes,
        chartSize: 280,
      })
    );
    const halfViewBox = result.current.layout.sizePx / 2;
    expect(result.current.labels).toHaveLength(20);
    for (const label of result.current.labels) {
      const bbox = bboxes[label.id];
      expect(label.x + bbox.w / 2).toBeLessThanOrEqual(halfViewBox + 1e-3);
      expect(label.x - bbox.w / 2).toBeGreaterThanOrEqual(-halfViewBox - 1e-3);
      expect(label.y + bbox.h / 2).toBeLessThanOrEqual(halfViewBox + 1e-3);
      expect(label.y - bbox.h / 2).toBeGreaterThanOrEqual(-halfViewBox - 1e-3);
    }
  });

  test('ghost entries render slices but are excluded from label layout', () => {
    // Ghost slices fade out during deletion animations. They must keep rendering (their
    // slice path shrinks toward zero sweep), but they should not occupy a label slot —
    // otherwise their stale full-size bbox could nudge visible labels around.
    const entries: RenderedEntry[] = [
      { id: 'a', name: 'Visible A', polarity: 'positive', weight: 5 },
      { id: 'ghost', name: 'Disappearing', polarity: 'positive', weight: 0.001, isGhost: true },
      { id: 'b', name: 'Visible B', polarity: 'positive', weight: 5 },
    ];
    const { result } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
        labelBBoxes: { a: { w: 70, h: 18 }, ghost: { w: 200, h: 50 }, b: { w: 70, h: 18 } },
      })
    );
    expect(result.current.slices).toHaveLength(3);
    expect(result.current.labels.map(l => l.id)).toEqual(['a', 'b']);
  });

  test('memoizes on stable input', () => {
    const entries = makeRendered([{ id: 'a', weight: 5, polarity: 'positive' }]);
    const { result, rerender } = renderHook(() =>
      useChartData({
        ...baseInput,
        renderedEntries: entries,
      })
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });
});
