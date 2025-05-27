import {
  calculatePercentage,
  calculateTotalEnergy,
  generateUniqueId,
  getChartPixelSize,
  getEnergyBalance,
  sortActivitiesByValue,
} from '@/app/lib/utils/calculations';
import { Activity, EnergyChart } from '@/app/types';

describe('calculations utilities', () => {
  describe('calculateTotalEnergy', () => {
    it('calculates total energy for activities', () => {
      const activities: Activity[] = [
        { id: '1', activity: 'Running', value: 80, color: '#ff0000' },
        { id: '2', activity: 'Reading', value: 60, color: '#00ff00' },
        { id: '3', activity: 'Music', value: 70, color: '#0000ff' },
      ];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(210);
    });

    it('returns 0 for empty activities array', () => {
      const total = calculateTotalEnergy([]);
      expect(total).toBe(0);
    });

    it('handles activities with zero values', () => {
      const activities: Activity[] = [
        { id: '1', activity: 'Test', value: 0, color: '#ff0000' },
        { id: '2', activity: 'Test2', value: 50, color: '#00ff00' },
      ];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(50);
    });

    it('handles negative values', () => {
      const activities: Activity[] = [
        { id: '1', activity: 'Test', value: -20, color: '#ff0000' },
        { id: '2', activity: 'Test2', value: 50, color: '#00ff00' },
      ];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(30);
    });

    it('handles decimal values', () => {
      const activities: Activity[] = [
        { id: '1', activity: 'Test', value: 10.5, color: '#ff0000' },
        { id: '2', activity: 'Test2', value: 20.7, color: '#00ff00' },
      ];

      const total = calculateTotalEnergy(activities);
      expect(total).toBe(31.2);
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

  describe('getChartPixelSize', () => {
    describe('desktop sizes', () => {
      it('returns correct pixel sizes for desktop', () => {
        expect(getChartPixelSize('small', false)).toBe(300);
        expect(getChartPixelSize('medium', false)).toBe(400);
        expect(getChartPixelSize('large', false)).toBe(500);
      });

      it('defaults to desktop when isMobile is not specified', () => {
        expect(getChartPixelSize('small')).toBe(300);
        expect(getChartPixelSize('medium')).toBe(400);
        expect(getChartPixelSize('large')).toBe(500);
      });
    });

    describe('mobile sizes', () => {
      it('returns correct pixel sizes for mobile', () => {
        expect(getChartPixelSize('small', true)).toBe(200);
        expect(getChartPixelSize('medium', true)).toBe(250);
        expect(getChartPixelSize('large', true)).toBe(300);
      });
    });

    it('mobile sizes are smaller than desktop sizes', () => {
      const sizes: Array<'small' | 'medium' | 'large'> = ['small', 'medium', 'large'];

      sizes.forEach(size => {
        const mobileSize = getChartPixelSize(size, true);
        const desktopSize = getChartPixelSize(size, false);
        expect(mobileSize).toBeLessThan(desktopSize);
      });
    });
  });

  describe('sortActivitiesByValue', () => {
    const activities: Activity[] = [
      { id: '1', activity: 'Low', value: 30, color: '#ff0000' },
      { id: '2', activity: 'High', value: 90, color: '#00ff00' },
      { id: '3', activity: 'Medium', value: 60, color: '#0000ff' },
    ];

    it('sorts activities in descending order by default', () => {
      const sorted = sortActivitiesByValue(activities);

      expect(sorted[0].value).toBe(90);
      expect(sorted[1].value).toBe(60);
      expect(sorted[2].value).toBe(30);
      expect(sorted[0].activity).toBe('High');
      expect(sorted[1].activity).toBe('Medium');
      expect(sorted[2].activity).toBe('Low');
    });

    it('sorts activities in ascending order when specified', () => {
      const sorted = sortActivitiesByValue(activities, false);

      expect(sorted[0].value).toBe(30);
      expect(sorted[1].value).toBe(60);
      expect(sorted[2].value).toBe(90);
      expect(sorted[0].activity).toBe('Low');
      expect(sorted[1].activity).toBe('Medium');
      expect(sorted[2].activity).toBe('High');
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
      const singleActivity: Activity[] = [{ id: '1', activity: 'Solo', value: 50, color: '#ff0000' }];

      const sorted = sortActivitiesByValue(singleActivity);
      expect(sorted).toEqual(singleActivity);
    });

    it('handles activities with equal values', () => {
      const equalValues: Activity[] = [
        { id: '1', activity: 'A', value: 50, color: '#ff0000' },
        { id: '2', activity: 'B', value: 50, color: '#00ff00' },
        { id: '3', activity: 'C', value: 50, color: '#0000ff' },
      ];

      const sorted = sortActivitiesByValue(equalValues);
      expect(sorted.every(a => a.value === 50)).toBe(true);
      expect(sorted).toHaveLength(3);
    });

    it('handles negative values', () => {
      const withNegative: Activity[] = [
        { id: '1', activity: 'Positive', value: 50, color: '#ff0000' },
        { id: '2', activity: 'Negative', value: -20, color: '#00ff00' },
        { id: '3', activity: 'Zero', value: 0, color: '#0000ff' },
      ];

      const sorted = sortActivitiesByValue(withNegative);
      expect(sorted[0].value).toBe(50);
      expect(sorted[1].value).toBe(0);
      expect(sorted[2].value).toBe(-20);
    });
  });

  describe('getEnergyBalance', () => {
    const positiveChart: EnergyChart = {
      type: 'positive',
      activities: [
        { id: '1', activity: 'Exercise', value: 80, color: '#ff0000' },
        { id: '2', activity: 'Music', value: 60, color: '#00ff00' },
      ],
    };

    const negativeChart: EnergyChart = {
      type: 'negative',
      activities: [
        { id: '3', activity: 'Stress', value: 70, color: '#ff0000' },
        { id: '4', activity: 'Fatigue', value: 30, color: '#00ff00' },
      ],
    };

    it('calculates energy balance correctly', () => {
      const balance = getEnergyBalance(positiveChart, negativeChart);

      expect(balance.positiveTotal).toBe(140); // 80 + 60
      expect(balance.negativeTotal).toBe(100); // 70 + 30
      expect(balance.balance).toBe(40); // 140 - 100
      expect(balance.balancePercentage).toBe(17); // round((40 / 240) * 100)
    });

    it('handles positive energy being higher', () => {
      const balance = getEnergyBalance(positiveChart, negativeChart);

      expect(balance.balance).toBeGreaterThan(0);
      expect(balance.balancePercentage).toBeGreaterThan(0);
    });

    it('handles negative energy being higher', () => {
      const higherNegativeChart: EnergyChart = {
        type: 'negative',
        activities: [{ id: '3', activity: 'Stress', value: 200, color: '#ff0000' }],
      };

      const balance = getEnergyBalance(positiveChart, higherNegativeChart);

      expect(balance.balance).toBeLessThan(0);
      expect(balance.balancePercentage).toBeLessThan(0);
      expect(balance.negativeTotal).toBe(200);
      expect(balance.balance).toBe(-60); // 140 - 200
    });

    it('handles equal positive and negative energy', () => {
      const equalNegativeChart: EnergyChart = {
        type: 'negative',
        activities: [{ id: '3', activity: 'Stress', value: 140, color: '#ff0000' }],
      };

      const balance = getEnergyBalance(positiveChart, equalNegativeChart);

      expect(balance.balance).toBe(0);
      expect(balance.balancePercentage).toBe(0);
    });

    it('handles empty charts', () => {
      const emptyPositive: EnergyChart = { type: 'positive', activities: [] };
      const emptyNegative: EnergyChart = { type: 'negative', activities: [] };

      const balance = getEnergyBalance(emptyPositive, emptyNegative);

      expect(balance.positiveTotal).toBe(0);
      expect(balance.negativeTotal).toBe(0);
      expect(balance.balance).toBe(0);
      expect(balance.balancePercentage).toBe(0);
    });

    it('handles one empty chart', () => {
      const emptyNegative: EnergyChart = { type: 'negative', activities: [] };

      const balance = getEnergyBalance(positiveChart, emptyNegative);

      expect(balance.positiveTotal).toBe(140);
      expect(balance.negativeTotal).toBe(0);
      expect(balance.balance).toBe(140);
      expect(balance.balancePercentage).toBe(100);
    });

    it('rounds balance percentage correctly', () => {
      // Create scenario that results in non-integer percentage
      const customPositive: EnergyChart = {
        type: 'positive',
        activities: [{ id: '1', activity: 'Test', value: 33, color: '#ff0000' }],
      };
      const customNegative: EnergyChart = {
        type: 'negative',
        activities: [{ id: '2', activity: 'Test', value: 67, color: '#00ff00' }],
      };

      const balance = getEnergyBalance(customPositive, customNegative);

      // balance = 33 - 67 = -34
      // total = 33 + 67 = 100
      // percentage = (-34 / 100) * 100 = -34%
      expect(balance.balancePercentage).toBe(-34);
    });

    it('handles decimal values', () => {
      const decimalPositive: EnergyChart = {
        type: 'positive',
        activities: [{ id: '1', activity: 'Test', value: 33.7, color: '#ff0000' }],
      };
      const decimalNegative: EnergyChart = {
        type: 'negative',
        activities: [{ id: '2', activity: 'Test', value: 66.3, color: '#00ff00' }],
      };

      const balance = getEnergyBalance(decimalPositive, decimalNegative);

      expect(balance.positiveTotal).toBe(33.7);
      expect(balance.negativeTotal).toBe(66.3);
      expect(balance.balance).toBeCloseTo(-32.6, 1); // Use toBeCloseTo for floating point precision
      expect(balance.balancePercentage).toBe(-33); // rounded
    });
  });
});
