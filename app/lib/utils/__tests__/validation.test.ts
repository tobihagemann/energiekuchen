import { createMockActivity } from '../../../__tests__/utils/mocks';
import { validateActivity, validateActivityName, validateActivityValue, validateChartActivities } from '../validation';

describe('Activity Validation', () => {
  test('should validate correct activity', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject invalid activity name', () => {
    const result = validateActivityName('');
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Name darf nicht leer sein');
  });

  test('should reject invalid activity value', () => {
    const result = validateActivityValue(6);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Anteil muss zwischen -5 und +5 liegen');
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

  test('should reject activity value of zero', () => {
    const result = validateActivityValue(0);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Anteil darf nicht 0 sein');
  });

  test('should reject activity value below minimum', () => {
    const result = validateActivityValue(-6);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Anteil muss zwischen -5 und +5 liegen');
  });

  test('should accept negative activity values', () => {
    const result = validateActivityValue(-5);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject non-integer activity value', () => {
    const result = validateActivityValue(3.5);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Anteil muss eine ganze Zahl sein');
  });

  test('should reject activity with name too long', () => {
    const result = validateActivity({
      name: 'a'.repeat(51), // Too long name
      value: 5,
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Aktivitätsname darf maximal 50 Zeichen haben');
  });

  test('should accept activity with emojis in name', () => {
    const result = validateActivity({
      name: 'Kaffee ☕',
      value: 5,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with special symbols in name', () => {
    const result = validateActivity({
      name: '100% Entspannung',
      value: 4,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with value too high', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 6, // Too high value
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Anteil muss zwischen -5 und +5 liegen');
  });

  test('should reject activity with value of zero', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 0, // Zero value
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Anteil darf nicht 0 sein');
  });

  test('should reject activity with value too low', () => {
    const result = validateActivity({
      name: 'Sport',
      value: -6, // Too low value
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Anteil muss zwischen -5 und +5 liegen');
  });

  test('should accept activity with negative value', () => {
    const result = validateActivity({
      name: 'Stress',
      value: -3,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with missing value', () => {
    const result = validateActivity({
      name: 'Sport',
      // value is missing
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Anteil muss zwischen -5 und +5 liegen');
  });

  test('should reject activity with multiple validation errors', () => {
    const result = validateActivity({
      name: '', // Empty name
      value: 6, // Invalid value
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors).toContain('Aktivitätsname ist erforderlich');
    expect(result.errors).toContain('Anteil muss zwischen -5 und +5 liegen');
  });

  test('should accept activity with valid details', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
      details: 'Jeden Tag 30 Minuten joggen',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity without details (optional field)', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with empty details string', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
      details: '',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should accept activity with details at max length (150 chars)', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
      details: 'a'.repeat(150),
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('should reject activity with details too long', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
      details: 'a'.repeat(151), // Too long
    });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Details dürfen maximal 150 Zeichen haben');
  });

  test('should accept activity with details containing newlines', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 3,
      details: 'Zeile 1\nZeile 2\nZeile 3',
    });
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
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
    const activities = [
      createMockActivity({ name: 'Sport' }),
      createMockActivity({ name: 'sport' }), // Same name, different case
    ];
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
