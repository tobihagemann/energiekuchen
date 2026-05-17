import { getColorForPolarity, NEGATIVE_COLOR, POSITIVE_COLOR } from '../constants';

describe('color constants', () => {
  it('POSITIVE_COLOR matches the level-3 green oklch literal', () => {
    expect(POSITIVE_COLOR).toBe('oklch(0.723 0.219 149.579)');
  });

  it('NEGATIVE_COLOR matches the level-3 red oklch literal', () => {
    expect(NEGATIVE_COLOR).toBe('oklch(0.637 0.237 25.331)');
  });
});

describe('getColorForPolarity', () => {
  it('returns POSITIVE_COLOR for positive polarity', () => {
    expect(getColorForPolarity('positive')).toBe(POSITIVE_COLOR);
  });

  it('returns NEGATIVE_COLOR for negative polarity', () => {
    expect(getColorForPolarity('negative')).toBe(NEGATIVE_COLOR);
  });
});
