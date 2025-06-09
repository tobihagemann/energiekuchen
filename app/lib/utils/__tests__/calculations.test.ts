import { createMockActivity } from '@/app/__tests__/utils/mocks';
import { calculatePercentage, calculateTotalEnergy, generateUniqueId, sortActivitiesByValue } from '@/app/lib/utils/calculations';
import { Activity } from '@/app/types';

describe('calculations utilities', () => {
  describe('calculateTotalEnergy', () => {
    it('calculates total energy for activities', () => {
      const activities: Activity[] = [
        createMockActivity({ name: 'Running', value: 8 }),
        createMockActivity({ name: 'Reading', value: 6 }),
        createMockActivity({ name: 'Music', value: 7 }),
      ];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(21);
    });

    it('returns 0 for empty activities array', () => {
      const total = calculateTotalEnergy([]);
      expect(total).toBe(0);
    });

    it('handles activities with zero values', () => {
      const activities: Activity[] = [createMockActivity({ name: 'Test', value: 0 }), createMockActivity({ name: 'Test2', value: 5 })];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(5);
    });

    it('handles negative values', () => {
      const activities: Activity[] = [createMockActivity({ name: 'Test', value: -2 }), createMockActivity({ name: 'Test2', value: 5 })];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(3);
    });

    it('handles decimal values', () => {
      const activities: Activity[] = [createMockActivity({ name: 'Test', value: 1.5 }), createMockActivity({ name: 'Test2', value: 2.7 })];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(4.2);
    });
  });

  describe('calculatePercentage', () => {
    it('calculates percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
      expect(calculatePercentage(75, 300)).toBe(25);
    });

    it('rounds to nearest integer', () => {
      expect(calculatePercentage(33, 100)).toBe(33);
      expect(calculatePercentage(33.4, 100)).toBe(33);
      expect(calculatePercentage(33.5, 100)).toBe(34);
      expect(calculatePercentage(33.6, 100)).toBe(34);
    });

    it('returns 0 when total is 0', () => {
      expect(calculatePercentage(50, 0)).toBe(0);
      expect(calculatePercentage(0, 0)).toBe(0);
    });

    it('handles negative values', () => {
      expect(calculatePercentage(-25, 100)).toBe(-25);
      expect(calculatePercentage(25, -100)).toBe(-25);
      expect(calculatePercentage(-25, -100)).toBe(25);
    });

    it('handles decimal inputs', () => {
      expect(calculatePercentage(12.5, 50)).toBe(25);
      expect(calculatePercentage(33.33, 100)).toBe(33);
    });

    it('handles values larger than total', () => {
      expect(calculatePercentage(150, 100)).toBe(150);
    });
  });

  describe('generateUniqueId', () => {
    it('generates unique IDs', () => {
      const id1 = generateUniqueId();
      const id2 = generateUniqueId();

      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });

    it('generates IDs with expected format', () => {
      const id = generateUniqueId();

      expect(id).toMatch(/^[0-9a-z]+$/);
      expect(id.length).toBeGreaterThan(10);
    });

    it('generates many unique IDs', () => {
      const ids = new Set();
      const count = 1000;

      for (let i = 0; i < count; i++) {
        ids.add(generateUniqueId());
      }

      expect(ids.size).toBe(count);
    });

    it('generates IDs that are URL-safe', () => {
      const id = generateUniqueId();

      // Should not contain characters that need URL encoding
      expect(id).not.toMatch(/[+/=]/);
    });
  });

  describe('sortActivitiesByValue', () => {
    const activities: Activity[] = [
      createMockActivity({ name: 'Low', value: 3 }),
      createMockActivity({ name: 'High', value: 9 }),
      createMockActivity({ name: 'Medium', value: 6 }),
    ];

    it('sorts activities in descending order by default', () => {
      const sorted = sortActivitiesByValue(activities);

      expect(sorted[0].value).toBe(9);
      expect(sorted[1].value).toBe(6);
      expect(sorted[2].value).toBe(3);
      expect(sorted[0].name).toBe('High');
      expect(sorted[1].name).toBe('Medium');
      expect(sorted[2].name).toBe('Low');
    });

    it('sorts activities in ascending order when specified', () => {
      const sorted = sortActivitiesByValue(activities, false);

      expect(sorted[0].value).toBe(3);
      expect(sorted[1].value).toBe(6);
      expect(sorted[2].value).toBe(9);
      expect(sorted[0].name).toBe('Low');
      expect(sorted[1].name).toBe('Medium');
      expect(sorted[2].name).toBe('High');
    });

    it('does not mutate the original array', () => {
      const originalOrder = activities.map(a => a.value);
      sortActivitiesByValue(activities);

      expect(activities.map(a => a.value)).toEqual(originalOrder);
    });

    it('handles empty array', () => {
      const sorted = sortActivitiesByValue([]);
      expect(sorted).toEqual([]);
    });

    it('handles single activity', () => {
      const singleActivity: Activity[] = [createMockActivity({ name: 'Solo', value: 5 })];

      const sorted = sortActivitiesByValue(singleActivity);
      expect(sorted).toEqual(singleActivity);
    });

    it('handles activities with equal values', () => {
      const equalValues: Activity[] = [
        createMockActivity({ name: 'A', value: 5 }),
        createMockActivity({ name: 'B', value: 5 }),
        createMockActivity({ name: 'C', value: 5 }),
      ];

      const sorted = sortActivitiesByValue(equalValues);
      expect(sorted.every(a => a.value === 5)).toBe(true);
      expect(sorted).toHaveLength(3);
    });

    it('handles negative values', () => {
      const withNegative: Activity[] = [
        createMockActivity({ name: 'Positive', value: 5 }),
        createMockActivity({ name: 'Negative', value: -2 }),
        createMockActivity({ name: 'Zero', value: 0 }),
      ];

      const sorted = sortActivitiesByValue(withNegative);
      expect(sorted[0].value).toBe(5);
      expect(sorted[1].value).toBe(0);
      expect(sorted[2].value).toBe(-2);
    });
  });
});
