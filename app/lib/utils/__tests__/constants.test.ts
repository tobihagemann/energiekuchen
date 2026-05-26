import { NEGATIVE_COLOR, POSITIVE_COLOR } from '../constants';

describe('color constants', () => {
  it('POSITIVE_COLOR matches the green-500 oklch literal (band midpoint)', () => {
    expect(POSITIVE_COLOR).toBe('oklch(0.723 0.219 149.579)');
  });

  it('NEGATIVE_COLOR matches the red-500 oklch literal (band midpoint)', () => {
    expect(NEGATIVE_COLOR).toBe('oklch(0.637 0.237 25.331)');
  });
});
