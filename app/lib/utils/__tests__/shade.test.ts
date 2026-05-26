import { assignShadeDepths, getActiveBorderExpr, getInsideTextColor, getShadeColor } from '../shade';

function parseOklch(s: string): [number, number, number] {
  const m = s.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/);
  if (!m) throw new Error(`not an oklch literal: ${s}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

describe('assignShadeDepths', () => {
  it('fans depths out from the 0.5 midpoint: biggest darkest, symmetric about the middle', () => {
    const depths = assignShadeDepths([
      { id: 'a', polarity: 'positive', weight: 3 },
      { id: 'b', polarity: 'positive', weight: 6 },
      { id: 'c', polarity: 'positive', weight: 1 },
    ]);
    expect(depths.b).toBeGreaterThan(depths.a); // bigger weight → darker
    expect(depths.a).toBeGreaterThan(depths.c);
    expect(depths.a).toBeCloseTo(0.5, 10); // the middle rank sits on the midpoint
    expect(depths.b + depths.c).toBeCloseTo(1, 10); // outer ranks straddle 0.5 symmetrically
  });

  it('maps a lone slice to the band midpoint', () => {
    expect(assignShadeDepths([{ id: 'a', polarity: 'positive', weight: 7 }])).toEqual({ a: 0.5 });
  });

  it('returns an empty map for an empty chart', () => {
    expect(assignShadeDepths([])).toEqual({});
  });

  it('handles a "__proto__" id (user-controlled via import) as an ordinary numeric depth', () => {
    const depths = assignShadeDepths([{ id: '__proto__', polarity: 'positive', weight: 1 }]);
    expect(typeof depths['__proto__']).toBe('number');
    expect(depths['__proto__']).toBe(0.5);
  });

  it('spreads a 2-slice group one named stop either side of 500 (green-400/green-600)', () => {
    const depths = assignShadeDepths([
      { id: 'a', polarity: 'positive', weight: 5 },
      { id: 'b', polarity: 'positive', weight: 1 },
    ]);
    expect(depths.a).toBeCloseTo(2 / 3, 10); // depth 2/3 lands on green-600
    expect(depths.b).toBeCloseTo(1 / 3, 10); // depth 1/3 lands on green-400
  });

  it('breaks ties by input order (stable)', () => {
    const depths = assignShadeDepths([
      { id: 'a', polarity: 'positive', weight: 5 },
      { id: 'b', polarity: 'positive', weight: 5 },
    ]);
    expect(depths.a).toBeGreaterThan(depths.b);
    expect(depths.a).toBeCloseTo(2 / 3, 10);
  });

  it('ranks polarities independently', () => {
    const depths = assignShadeDepths([
      { id: 'p1', polarity: 'positive', weight: 2 },
      { id: 'n1', polarity: 'negative', weight: 9 },
      { id: 'p2', polarity: 'positive', weight: 8 },
      { id: 'n2', polarity: 'negative', weight: 1 },
    ]);
    expect(depths.p2).toBeGreaterThan(depths.p1); // darkest positive
    expect(depths.n1).toBeGreaterThan(depths.n2); // darkest negative
    expect(depths.p2).toBeCloseTo(2 / 3, 10);
    expect(depths.n1).toBeCloseTo(2 / 3, 10);
  });

  it('widens the band as a group grows, reaching the full ramp at the activity cap', () => {
    const darkest = (n: number) => assignShadeDepths(Array.from({ length: n }, (_, i) => ({ id: `${i}`, polarity: 'positive' as const, weight: n - i })))['0'];
    expect(darkest(2)).toBeCloseTo(2 / 3, 10); // gentle for a couple of slices
    expect(darkest(2)).toBeLessThan(darkest(10)); // wider as slices pile up
    expect(darkest(10)).toBeLessThan(darkest(20));
    expect(darkest(20)).toBeCloseTo(1, 10); // full ramp (green-800) at the 20-activity cap
  });
});

describe('getShadeColor', () => {
  it('returns the pale (200) endpoint at depth 0 and the dark (800) endpoint at depth 1', () => {
    expect(getShadeColor('positive', 0)).toBe('oklch(0.925 0.084 155.995)'); // green-200
    expect(getShadeColor('positive', 1)).toBe('oklch(0.448 0.119 151.328)'); // green-800
    expect(getShadeColor('negative', 0)).toBe('oklch(0.885 0.062 18.334)'); // red-200
    expect(getShadeColor('negative', 1)).toBe('oklch(0.444 0.177 26.899)'); // red-800
  });

  it('lands the band midpoint on the vivid 500 shade (the prior flat color)', () => {
    expect(getShadeColor('positive', 0.5)).toBe('oklch(0.723 0.219 149.579)'); // green-500
    expect(getShadeColor('negative', 0.5)).toBe('oklch(0.637 0.237 25.331)'); // red-500
  });

  it('lands exact stops on whole-sixth depths and interpolates between them', () => {
    expect(getShadeColor('positive', 1 / 6)).toBe('oklch(0.871 0.15 154.449)'); // green-300
    const [l, c, h] = parseOklch(getShadeColor('positive', 1 / 12)); // halfway between 200 and 300
    expect(l).toBeCloseTo((0.925 + 0.871) / 2, 3);
    expect(c).toBeCloseTo((0.084 + 0.15) / 2, 3);
    expect(h).toBeCloseTo((155.995 + 154.449) / 2, 2);
  });

  it('clamps out-of-range depths to the ramp endpoints', () => {
    expect(getShadeColor('positive', -0.5)).toBe('oklch(0.925 0.084 155.995)'); // green-200
    expect(getShadeColor('positive', 1.5)).toBe('oklch(0.448 0.119 151.328)'); // green-800
  });
});

describe('adaptive helpers flip at the lightness threshold', () => {
  it('uses gray-900 inside text on pale fills and white on dark fills', () => {
    expect(getInsideTextColor(0)).toBe('oklch(0.21 0.034 264.665)'); // gray-900
    expect(getInsideTextColor(0.49)).toBe('oklch(0.21 0.034 264.665)');
    expect(getInsideTextColor(0.5)).toBe('oklch(1 0 0)'); // white
    expect(getInsideTextColor(1)).toBe('oklch(1 0 0)');
  });

  it('darkens the active border on pale fills and lightens it on dark fills', () => {
    expect(getActiveBorderExpr('oklch(0.9 0.05 150)', 0)).toBe('oklch(from oklch(0.9 0.05 150) calc(l - 0.1) c h)');
    expect(getActiveBorderExpr('oklch(0.45 0.12 150)', 1)).toBe('oklch(from oklch(0.45 0.12 150) calc(l + 0.1) c h)');
  });
});
