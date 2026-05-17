import { Activity } from '@/app/types';

import { getFloor } from '../floor';
import { redistributeProportionalAll, redistributeTwoDonor, renormalizeToFloor } from '../redistribution';

const activity = (id: string, weight: number, polarity: 'positive' | 'negative' = 'positive'): Activity => ({
  id,
  name: id,
  weight,
  polarity,
});

const totalOf = (entries: Array<{ weight: number }>) => entries.reduce((sum, e) => sum + e.weight, 0);

describe('redistributeTwoDonor', () => {
  test('balanced pair: transfers delta and preserves pair sum', () => {
    const entries = [
      { id: 'a', weight: 5 },
      { id: 'b', weight: 5 },
      { id: 'c', weight: 5 },
    ];
    const result = redistributeTwoDonor(entries, 0, 1, 1, 0.15);
    expect(result[0].weight).toBeCloseTo(6, 2);
    expect(result[1].weight).toBeCloseTo(4, 2);
    expect(result[2].weight).toBe(5);
    expect(totalOf(result)).toBeCloseTo(15, 2);
  });

  test('donor at floor: clamps and assigns residual to receiver', () => {
    const entries = [
      { id: 'a', weight: 9.9 },
      { id: 'b', weight: 0.1 },
    ];
    const floor = getFloor(10);
    const result = redistributeTwoDonor(entries, 0, 1, 0.5, floor);
    expect(result[1].weight).toBeGreaterThanOrEqual(floor);
    expect(totalOf(result)).toBeCloseTo(10, 2);
  });

  test('receiver at floor going down: clamp symmetry', () => {
    const entries = [
      { id: 'a', weight: 0.1 },
      { id: 'b', weight: 9.9 },
    ];
    const floor = getFloor(10);
    // Negative case is encoded as "donor and receiver swap": here we transfer to b from a.
    const result = redistributeTwoDonor(entries, 1, 0, 0.5, floor);
    expect(result[0].weight).toBeGreaterThanOrEqual(floor);
    expect(totalOf(result)).toBeCloseTo(10, 2);
  });

  test('near-floor repeated drags keep pair sum stable under rounding', () => {
    let entries = [
      { id: 'a', weight: 0.5 },
      { id: 'b', weight: 0.5 },
    ];
    const floor = 0.01;
    const initial = totalOf(entries);
    for (let i = 0; i < 20; i++) {
      entries = redistributeTwoDonor(entries, 0, 1, 0.01, floor);
      entries = redistributeTwoDonor(entries, 1, 0, 0.01, floor);
    }
    expect(totalOf(entries)).toBeCloseTo(initial, 2);
  });

  test('polarity-wrap seam: last index → first index works', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
      { id: 'c', weight: 4 },
    ];
    const result = redistributeTwoDonor(entries, 0, 2, 1, 0.12);
    expect(result[0].weight).toBeCloseTo(5, 2);
    expect(result[2].weight).toBeCloseTo(3, 2);
    expect(result[1].weight).toBe(4);
  });

  test('returns fresh copy when indices are invalid', () => {
    const entries = [{ id: 'a', weight: 4 }];
    const result = redistributeTwoDonor(entries, 0, 0, 1, 0.04);
    expect(result).toEqual(entries);
    expect(result).not.toBe(entries);
  });

  test('out-of-range indices short-circuit to a fresh copy', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
    ];
    const negative = redistributeTwoDonor(entries, -1, 0, 1, 0.04);
    expect(negative).toEqual(entries);
    const tooLarge = redistributeTwoDonor(entries, 0, 99, 1, 0.04);
    expect(tooLarge).toEqual(entries);
  });

  test('receiver below floor pre-rounding clamp branch (pairSum below 2*floor)', () => {
    const entries = [
      { id: 'a', weight: 0.005 },
      { id: 'b', weight: 0.005 },
    ];
    const floor = 0.01;
    const result = redistributeTwoDonor(entries, 0, 1, 0, floor);
    expect(result[0].weight).toBeGreaterThanOrEqual(floor);
  });

  test('receiver underflow after rounding triggers the receiver-clamp branch', () => {
    const entries = [
      { id: 'a', weight: 0.014 },
      { id: 'b', weight: 0.006 },
    ];
    const floor = 0.01;
    const result = redistributeTwoDonor(entries, 1, 0, 0, floor);
    expect(result[0].weight).toBeGreaterThanOrEqual(floor);
    expect(result[1].weight).toBeGreaterThanOrEqual(floor);
  });

  test('R13 both-clamp branch fires when rounding underflows the floor', () => {
    const entries = [
      { id: 'a', weight: 0.015 },
      { id: 'b', weight: 0.985 },
    ];
    const floor = 0.01;
    const result = redistributeTwoDonor(entries, 1, 0, 0.01, floor);
    expect(result[0].weight).toBeGreaterThanOrEqual(floor);
    expect(result[1].weight).toBeGreaterThanOrEqual(floor);
    expect(totalOf(result)).toBeCloseTo(1, 2);
  });
});

describe('redistributeProportionalAll', () => {
  test('simple 3-slice case preserves total', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
      { id: 'c', weight: 4 },
    ];
    const result = redistributeProportionalAll(entries, 'a', 6, 0.12);
    expect(totalOf(result)).toBeCloseTo(12, 2);
    expect(result.find(r => r.id === 'a')?.weight).toBe(6);
  });

  test('clamps an entry at the floor when it would drop below', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
      { id: 'c', weight: 4 },
    ];
    const floor = getFloor(12);
    const result = redistributeProportionalAll(entries, 'a', 11, floor);
    for (const r of result) {
      expect(r.weight).toBeGreaterThanOrEqual(floor - 0.005);
    }
    expect(totalOf(result)).toBeCloseTo(12, 2);
  });

  test('one slice already exactly at floor is preserved when target shrinks', () => {
    const entries = [
      { id: 'a', weight: 9.99 },
      { id: 'b', weight: 0.01 },
    ];
    const result = redistributeProportionalAll(entries, 'a', 5, 0.1);
    expect(result.find(r => r.id === 'b')?.weight).toBeGreaterThanOrEqual(0.1);
  });

  test('all-but-one at floor scenario', () => {
    const entries = [
      { id: 'a', weight: 9 },
      { id: 'b', weight: 0.5 },
      { id: 'c', weight: 0.5 },
    ];
    const floor = getFloor(10);
    const result = redistributeProportionalAll(entries, 'a', 9.5, floor);
    for (const r of result) {
      expect(r.weight).toBeGreaterThanOrEqual(floor);
    }
    expect(totalOf(result)).toBeCloseTo(10, 2);
  });

  test('repeated same-target invocations are stable (rounding)', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
      { id: 'c', weight: 4 },
    ];
    const floor = getFloor(12);
    const first = redistributeProportionalAll(entries, 'a', 6, floor);
    const second = redistributeProportionalAll(first, 'a', 6, floor);
    expect(second).toEqual(first);
  });

  test('preserves input order in the output array', () => {
    const entries = [
      { id: 'a', weight: 4 },
      { id: 'b', weight: 4 },
      { id: 'c', weight: 4 },
    ];
    const result = redistributeProportionalAll(entries, 'b', 6, 0.12);
    expect(result.map(r => r.id)).toEqual(['a', 'b', 'c']);
  });

  test('returns a copy when target id is not present', () => {
    const entries = [{ id: 'a', weight: 4 }];
    const result = redistributeProportionalAll(entries, 'missing', 10, 0.04);
    expect(result).toEqual(entries);
    expect(result).not.toBe(entries);
  });

  test('single-entry chart short-circuits when target is the only entry', () => {
    const entries = [{ id: 'a', weight: 7 }];
    const result = redistributeProportionalAll(entries, 'a', 10, 0.1);
    expect(result).toEqual([{ id: 'a', weight: 10 }]);
  });

  test('forces all-other clamping (aboveSum hits zero)', () => {
    const entries = [
      { id: 'a', weight: 50 },
      { id: 'b', weight: 1 },
    ];
    const result = redistributeProportionalAll(entries, 'a', 50.5, 1);
    const total = totalOf(result);
    expect(total).toBeCloseTo(51, 2);
    expect(result.find(r => r.id === 'b')?.weight).toBeGreaterThanOrEqual(1);
  });

  test('rounding residual is assigned back to largest non-clamped entry', () => {
    // Choose values where proportional distribution leaves a small rounding residual.
    const entries = [
      { id: 'a', weight: 1 },
      { id: 'b', weight: 1 },
      { id: 'c', weight: 1 },
    ];
    const result = redistributeProportionalAll(entries, 'a', 1.01, 0.03);
    expect(totalOf(result)).toBeCloseTo(3, 2);
  });
});

describe('renormalizeToFloor', () => {
  test('n=1 short-circuit returns the activity unchanged', () => {
    const result = renormalizeToFloor([activity('a', 0.0001)]);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('a');
  });

  test('returns empty array as-is', () => {
    expect(renormalizeToFloor([])).toEqual([]);
  });

  test('capacity scale-up: all weights below floor', () => {
    const result = renormalizeToFloor([activity('a', 0.001), activity('b', 0.002), activity('c', 0.003)]);
    const total = totalOf(result);
    const floor = getFloor(total);
    for (const r of result) {
      expect(r.weight).toBeGreaterThanOrEqual(floor);
    }
    expect(result.length * floor).toBeLessThanOrEqual(total + 0.01);
  });

  test('representability scale-up: integer-percentage floor times n must fit 100', () => {
    const result = renormalizeToFloor([activity('a', 0.01), activity('b', 0.01), activity('c', 0.01)]);
    const total = totalOf(result);
    const floor = getFloor(total);
    expect(Math.ceil((floor / total) * 100) * result.length).toBeLessThanOrEqual(100);
  });

  test('clamps a below-floor activity in a normal chart', () => {
    const result = renormalizeToFloor([activity('a', 99), activity('b', 0.5)]);
    const total = totalOf(result);
    const floor = getFloor(total);
    for (const r of result) {
      expect(r.weight).toBeGreaterThanOrEqual(floor);
    }
  });

  test('leaves a well-formed chart untouched up to rounding', () => {
    const before = [activity('a', 5), activity('b', 5)];
    const after = renormalizeToFloor(before);
    expect(after.map(a => a.weight)).toEqual([5, 5]);
  });

  test('zero-total input is seeded so renormalization can run', () => {
    const result = renormalizeToFloor([activity('a', 0), activity('b', 0)]);
    expect(totalOf(result)).toBeGreaterThan(0);
  });

  test('exits cleanly when aboveSum reaches zero mid-iteration', () => {
    // 4 entries all near the floor — the deficit can't be fully redistributed.
    const result = renormalizeToFloor([activity('a', 0.5), activity('b', 0.5), activity('c', 0.5), activity('d', 0.5)]);
    expect(result).toHaveLength(4);
    const total = totalOf(result);
    const floor = getFloor(total);
    for (const r of result) {
      expect(r.weight).toBeGreaterThanOrEqual(floor - 0.005);
    }
  });
});
