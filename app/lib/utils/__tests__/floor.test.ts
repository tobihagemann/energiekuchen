import { getFloor, round2 } from '../floor';

describe('getFloor', () => {
  it('returns the 0.01 lower bound for tiny totals', () => {
    expect(getFloor(0)).toBe(0.01);
    expect(getFloor(0.5)).toBe(0.01);
    expect(getFloor(1)).toBe(0.01);
  });

  it('rounds up to 2 decimals for typical totals', () => {
    expect(getFloor(100)).toBe(1);
    expect(getFloor(250)).toBe(2.5);
    expect(getFloor(73)).toBe(0.73);
  });

  it('handles large totals', () => {
    expect(getFloor(10000)).toBe(100);
    expect(getFloor(99999)).toBe(999.99);
  });
});

describe('round2', () => {
  it('rounds to two decimal places', () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.235)).toBeCloseTo(1.24, 2);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it('preserves whole numbers', () => {
    expect(round2(5)).toBe(5);
  });
});
