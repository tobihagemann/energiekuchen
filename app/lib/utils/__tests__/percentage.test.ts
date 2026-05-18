import { getPercentage } from '../percentage';

describe('getPercentage', () => {
  it('returns rounded integer percentage', () => {
    expect(getPercentage(1, 4)).toBe(25);
    expect(getPercentage(3, 4)).toBe(75);
  });

  it('rounds to nearest integer at the 0.5 boundary', () => {
    expect(getPercentage(1, 8)).toBe(13); // 12.5 -> 13
    expect(getPercentage(3, 8)).toBe(38); // 37.5 -> 38
  });

  it('returns 0 when total is zero', () => {
    expect(getPercentage(1, 0)).toBe(0);
  });

  it('returns 0 when total is negative', () => {
    expect(getPercentage(1, -10)).toBe(0);
  });

  it('returns 100 when weight equals total', () => {
    expect(getPercentage(7, 7)).toBe(100);
  });
});
