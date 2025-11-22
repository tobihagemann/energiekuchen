import { getColorForLevel } from '../constants';

describe('getColorForLevel', () => {
  it('should return correct color for positive levels', () => {
    const color1 = getColorForLevel(1);
    const color5 = getColorForLevel(5);
    expect(color1).toContain('oklch');
    expect(color5).toContain('oklch');
    expect(color1).not.toBe(color5);
  });

  it('should return correct color for negative levels', () => {
    const color1 = getColorForLevel(-1);
    const color5 = getColorForLevel(-5);
    expect(color1).toContain('oklch');
    expect(color5).toContain('oklch');
    expect(color1).not.toBe(color5);
  });

  it('should clamp values above 5', () => {
    const color5 = getColorForLevel(5);
    const color10 = getColorForLevel(10);
    expect(color5).toBe(color10);
  });

  it('should clamp values below -5', () => {
    const color5 = getColorForLevel(-5);
    const color10 = getColorForLevel(-10);
    expect(color5).toBe(color10);
  });

  it('should handle zero by returning negative color', () => {
    const color = getColorForLevel(0);
    expect(color).toContain('oklch');
  });
});
