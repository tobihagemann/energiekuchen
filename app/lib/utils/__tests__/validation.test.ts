import { createMockActivity } from '../../../__tests__/utils/mocks';
import {
  validateActivity,
  validateActivityName,
  validateActivityPolarity,
  validateActivityValue,
  validateActivityWeight,
  validateChartActivities,
  validateLabelOffset,
} from '../validation';

describe('Activity Validation', () => {
  test('should validate correct activity', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 4,
      polarity: 'positive',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid activity name', () => {
    const result = validateActivityName('');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Name darf nicht leer sein');
  });

  test('should reject activity name that is too long', () => {
    const longName = 'a'.repeat(51);
    const result = validateActivityName(longName);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Name darf maximal 50 Zeichen haben');
  });

  test('should accept activity name with emojis', () => {
    const result = validateActivityName('Sport 🏃');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity name with special symbols', () => {
    const result = validateActivityName('80% Arbeit');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity name with parentheses', () => {
    const result = validateActivityName('Familie (Qualitätszeit)');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity name with accented characters', () => {
    const result = validateActivityName('Café');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity name with math symbols', () => {
    const result = validateActivityName('5+5 Minuten');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity name with quotes', () => {
    const result = validateActivityName('"Me-Time"');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with name too long', () => {
    const result = validateActivity({
      name: 'a'.repeat(51),
      weight: 5,
      polarity: 'positive',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Aktivitätsname darf maximal 50 Zeichen haben');
  });

  test('should accept activity with emojis in name', () => {
    const result = validateActivity({
      name: 'Kaffee ☕',
      weight: 5,
      polarity: 'positive',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with special symbols in name', () => {
    const result = validateActivity({
      name: '100% Entspannung',
      weight: 4,
      polarity: 'positive',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with negative polarity', () => {
    const result = validateActivity({
      name: 'Stress',
      weight: 3,
      polarity: 'negative',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with missing weight', () => {
    const result = validateActivity({
      name: 'Sport',
      polarity: 'positive',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Gewicht muss eine positive Zahl sein');
  });

  test('should reject activity with missing polarity', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 4,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Polarität muss positiv oder negativ sein');
  });

  test('should reject activity with multiple validation errors', () => {
    const result = validateActivity({
      name: '',
      weight: 0,
      polarity: 'unknown' as 'positive',
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Aktivitätsname ist erforderlich');
    expect(result.errors).toContain('Gewicht muss eine positive Zahl sein');
    expect(result.errors).toContain('Polarität muss positiv oder negativ sein');
  });

  test('should accept activity with valid details', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      details: 'Jeden Tag 30 Minuten joggen',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity without details (optional field)', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with empty details string', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      details: '',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with details at max length (150 chars)', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      details: 'a'.repeat(150),
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with details too long', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      details: 'a'.repeat(151),
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Details dürfen maximal 150 Zeichen haben');
  });

  test('should accept activity with multi-line details', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      details: 'Zeile 1\nZeile 2\nZeile 3',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with malformed labelOffset (treated as absent)', () => {
    const result = validateActivity({
      name: 'Sport',
      weight: 3,
      polarity: 'positive',
      labelOffset: { radial: NaN, angular: 0 },
    });
    expect(result.isValid).toBe(true);
  });
});

describe('validateActivityWeight', () => {
  test('rejects missing or non-number values', () => {
    expect(validateActivityWeight(undefined).isValid).toBe(false);
    expect(validateActivityWeight(null).isValid).toBe(false);
    expect(validateActivityWeight('4').isValid).toBe(false);
  });

  test('rejects non-finite values', () => {
    expect(validateActivityWeight(NaN).isValid).toBe(false);
    expect(validateActivityWeight(Infinity).isValid).toBe(false);
  });

  test('rejects zero and negative values', () => {
    const zero = validateActivityWeight(0);
    expect(zero.isValid).toBe(false);
    expect(zero.errors[0]).toContain('Gewicht muss eine positive Zahl sein');
    expect(validateActivityWeight(-1).isValid).toBe(false);
  });

  test('rejects values over the 10000 cap', () => {
    const result = validateActivityWeight(10001);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Gewicht darf 10000 nicht überschreiten');
  });

  test('accepts typical and boundary values', () => {
    expect(validateActivityWeight(0.01).isValid).toBe(true);
    expect(validateActivityWeight(4).isValid).toBe(true);
    expect(validateActivityWeight(10000).isValid).toBe(true);
  });
});

describe('validateActivityPolarity', () => {
  test('accepts the two valid polarities', () => {
    expect(validateActivityPolarity('positive').isValid).toBe(true);
    expect(validateActivityPolarity('negative').isValid).toBe(true);
  });

  test('rejects everything else', () => {
    expect(validateActivityPolarity(undefined).isValid).toBe(false);
    expect(validateActivityPolarity(null).isValid).toBe(false);
    expect(validateActivityPolarity('').isValid).toBe(false);
    expect(validateActivityPolarity('neutral').isValid).toBe(false);
    expect(validateActivityPolarity(1).isValid).toBe(false);
  });
});

describe('validateLabelOffset', () => {
  test('rejects non-objects', () => {
    expect(validateLabelOffset(null).isValid).toBe(false);
    expect(validateLabelOffset(undefined).isValid).toBe(false);
    expect(validateLabelOffset('x').isValid).toBe(false);
  });

  test('rejects NaN/Infinity values', () => {
    expect(validateLabelOffset({ radial: NaN, angular: 0 }).isValid).toBe(false);
    expect(validateLabelOffset({ radial: 0, angular: Infinity }).isValid).toBe(false);
  });

  test('clamps radial into [-0.5, 1.0]', () => {
    expect(validateLabelOffset({ radial: -1, angular: 0 }).normalized?.radial).toBe(-0.5);
    expect(validateLabelOffset({ radial: 2, angular: 0 }).normalized?.radial).toBe(1.0);
    expect(validateLabelOffset({ radial: 0.25, angular: 0 }).normalized?.radial).toBe(0.25);
  });

  test('normalizes angular into (-π, π]', () => {
    // 4-decimal rounding allows tiny overshoot of Math.PI (3.14159... → 3.1416).
    const epsilon = 1e-4;
    const result = validateLabelOffset({ radial: 0, angular: Math.PI * 3 });
    expect(result.normalized?.angular).toBeLessThanOrEqual(Math.PI + epsilon);
    expect(result.normalized?.angular).toBeGreaterThan(-Math.PI - epsilon);

    const wrapped = validateLabelOffset({ radial: 0, angular: -Math.PI * 3 });
    expect(wrapped.normalized?.angular).toBeLessThanOrEqual(Math.PI + epsilon);
    expect(wrapped.normalized?.angular).toBeGreaterThan(-Math.PI - epsilon);
  });

  test('rounds radial to 3 decimals and angular to 4 decimals', () => {
    const result = validateLabelOffset({ radial: 0.123456, angular: 1.234567 });
    expect(result.normalized?.radial).toBe(0.123);
    expect(result.normalized?.angular).toBe(1.2346);
  });
});

describe('validateActivityValue (legacy)', () => {
  test('rejects out-of-range values', () => {
    expect(validateActivityValue(6).isValid).toBe(false);
    expect(validateActivityValue(-6).isValid).toBe(false);
  });

  test('rejects zero', () => {
    const result = validateActivityValue(0);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Anteil darf nicht 0 sein');
  });

  test('rejects non-integer values', () => {
    expect(validateActivityValue(3.5).isValid).toBe(false);
  });

  test('accepts -5 and 5', () => {
    expect(validateActivityValue(-5).isValid).toBe(true);
    expect(validateActivityValue(5).isValid).toBe(true);
  });
});

describe('Chart Activities Validation', () => {
  test('should validate chart with valid activities', () => {
    const activities = [createMockActivity({ name: 'Sport' }), createMockActivity({ name: 'Lesen' })];
    const result = validateChartActivities(activities);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject chart with too many activities', () => {
    const activities = Array.from({ length: 21 }, (_, i) => createMockActivity({ name: `Activity ${i}` }));
    const result = validateChartActivities(activities);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Maximal 20 Aktivitäten erlaubt');
  });

  test('should reject chart with duplicate activity names', () => {
    const activities = [createMockActivity({ name: 'Sport' }), createMockActivity({ name: 'sport' })];
    const result = validateChartActivities(activities);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Aktivitätsnamen müssen eindeutig sein');
  });

  test('should allow empty activity list', () => {
    const result = validateChartActivities([]);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
