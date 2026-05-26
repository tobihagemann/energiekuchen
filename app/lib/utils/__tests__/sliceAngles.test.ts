import { computeStartAngles } from '../sliceAngles';

const START_ANGLE = -Math.PI / 2;

describe('computeStartAngles', () => {
  it('walks contiguously from the start angle with weight-proportional sweeps', () => {
    // Weights 3/6/3 of 12 give sweeps of π/2, π, π/2; cumulative starts land at -π/2, 0, π.
    const starts = computeStartAngles([3, 6, 3]);
    expect(starts[0]).toBeCloseTo(START_ANGLE);
    expect(starts[1]).toBeCloseTo(0);
    expect(starts[2]).toBeCloseTo(Math.PI);
  });

  it('covers exactly one full turn (last start + last sweep = start + 2π)', () => {
    const weights = [2, 5, 1, 4];
    const starts = computeStartAngles(weights);
    const total = weights.reduce((s, w) => s + w, 0);
    const lastSweep = (weights[weights.length - 1] / total) * Math.PI * 2;
    expect(starts[starts.length - 1] + lastSweep).toBeCloseTo(START_ANGLE + Math.PI * 2);
    // Each gap matches its slice's sweep.
    for (let i = 0; i < weights.length - 1; i++) {
      expect(starts[i + 1] - starts[i]).toBeCloseTo((weights[i] / total) * Math.PI * 2);
    }
  });

  it('returns the start angle alone for a single slice', () => {
    expect(computeStartAngles([5])).toEqual([START_ANGLE]);
  });

  it('returns an empty array for no slices', () => {
    expect(computeStartAngles([])).toEqual([]);
  });

  it('honors a custom start angle', () => {
    expect(computeStartAngles([1, 1], 0)).toEqual([0, Math.PI]);
  });
});
