import { createMockEnergyPie } from '../../../__tests__/utils/mocks';
import { StorageManager, exportData, importData } from '../storage';

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('should save and load data correctly', () => {
    const mockData = createMockEnergyPie();
    StorageManager.save(mockData);
    const loaded = StorageManager.load();
    expect(loaded).toEqual(mockData);
  });

  test('should handle export and import', () => {
    const mockData = createMockEnergyPie();
    const exported = exportData(mockData);
    const imported = importData(exported);

    // importData returns the data as-is since there are no more id/type fields
    const expectedData = mockData;

    expect(imported).toEqual(expectedData);
  });

  test('should throw error for invalid import data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => importData('invalid json')).toThrow('Ungültige Datei oder Datenformat');

    console.error = originalError;
  });

  test('should return null when no data in localStorage', () => {
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
  });

  test('should clear localStorage data', () => {
    const mockData = createMockEnergyPie();
    StorageManager.save(mockData);
    StorageManager.clear();
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
  });

  test('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Storage quota exceeded');
    });

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const mockData = createMockEnergyPie();
    expect(() => StorageManager.save(mockData)).toThrow('Daten konnten nicht gespeichert werden');

    // Restore original methods
    localStorage.setItem = originalSetItem;
    console.error = originalError;
  });

  test('should throw error when no data to export', () => {
    expect(() => StorageManager.export()).toThrow('Keine Daten zum Exportieren vorhanden');
  });

  test('should validate imported data structure', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidData = JSON.stringify({ version: '1.0' }); // Missing required fields
    expect(() => importData(invalidData)).toThrow('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');

    console.error = originalError;
  });

  test('should handle localStorage getItem errors gracefully', () => {
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const loaded = StorageManager.load();
    expect(loaded).toBeNull();

    // Restore original methods
    localStorage.getItem = originalGetItem;
    console.error = originalError;
  });

  test('should handle localStorage removeItem errors gracefully', () => {
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = jest.fn(() => {
      throw new Error('Storage error');
    });

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    // Should not throw
    expect(() => StorageManager.clear()).not.toThrow();

    // Restore original methods
    localStorage.removeItem = originalRemoveItem;
    console.error = originalError;
  });

  test('should handle corrupted JSON data in localStorage', () => {
    // Manually set corrupted JSON in localStorage
    localStorage.setItem('energiekuchen-data', '{"invalid": json}');

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
    // Verify localStorage was cleared
    expect(localStorage.getItem('energiekuchen-data')).toBeNull();

    console.error = originalError;
  });

  test('should export valid JSON with proper formatting', () => {
    const mockData = createMockEnergyPie();
    StorageManager.save(mockData);

    const exported = StorageManager.export();
    expect(() => JSON.parse(exported)).not.toThrow();
    expect(exported).toContain('\n'); // Should be formatted with newlines
  });

  test('should handle empty string import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => importData('')).toThrow('Ungültige Datei oder Datenformat');

    console.error = originalError;
  });

  test('should handle null values in import validation', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidData = JSON.stringify({ version: null, positive: null, negative: null });
    expect(() => importData(invalidData)).toThrow('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');

    console.error = originalError;
  });

  test('should validate StorageManager.import method', () => {
    const mockData = createMockEnergyPie();
    const exported = JSON.stringify(mockData, null, 2);

    const imported = StorageManager.import(exported);

    // StorageManager.import returns the data as-is since there are no more id/type fields
    const expectedData = mockData;

    expect(imported).toEqual(expectedData);
  });

  test('should handle StorageManager.import with invalid data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => StorageManager.import('invalid json')).toThrow('Ungültige Datei oder Datenformat');

    console.error = originalError;
  });

  test('should validate activity name during import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidActivity = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: '', // Invalid: empty name
            value: 5,
          },
        ],
      },
      negative: {
        activities: [],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidActivity))).toThrow('Aktivität muss einen Namen haben');

    console.error = originalError;
  });

  test('should validate activity value during import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidActivity = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            // value missing - this should trigger the validation error
          },
        ],
      },
      negative: {
        activities: [],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidActivity))).toThrow('Aktivität muss ein Energieniveau haben');

    console.error = originalError;
  });

  test('should validate activity name type during import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidActivity = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 123, // Invalid: name should be string
            value: 5,
          },
        ],
      },
      negative: {
        activities: [],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidActivity))).toThrow('Aktivität muss einen Namen haben');

    console.error = originalError;
  });

  test('should validate activity value type during import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidActivity = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            value: 'invalid', // Invalid: value should be number
          },
        ],
      },
      negative: {
        activities: [],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidActivity))).toThrow('Aktivität muss ein Energieniveau haben');

    console.error = originalError;
  });

  test('should handle activities that are not arrays', () => {
    const invalidData = {
      version: '1.0',
      positive: {
        activities: 'not an array', // Not an array
      },
    };

    const result = StorageManager.import(JSON.stringify(invalidData));
    expect(result.positive.activities).toEqual([]);
  });

  test('should handle missing size field with default', () => {
    const dataWithoutSize = {
      version: '1.0',
      positive: {
        activities: [],
        // missing size field
      },
    };

    const result = StorageManager.import(JSON.stringify(dataWithoutSize));
    // Size fields no longer exist
    expect(result.positive.activities).toEqual([]);
    expect(result.negative.activities).toEqual([]);
  });

  test('should reject activity with value too low (0)', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidValue = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            value: 0, // Invalid: below minimum
          },
        ],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidValue))).toThrow('Energieniveau muss zwischen 1 und 5 liegen');

    console.error = originalError;
  });

  test('should reject activity with value too high (10)', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithInvalidValue = {
      version: '1.0',
      negative: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            value: 6, // Invalid: above maximum
          },
        ],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithInvalidValue))).toThrow('Energieniveau muss zwischen 1 und 5 liegen');

    console.error = originalError;
  });

  test('should reject activity with negative value', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithNegativeValue = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            value: -5, // Invalid: negative value
          },
        ],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithNegativeValue))).toThrow('Energieniveau muss zwischen 1 und 5 liegen');

    console.error = originalError;
  });

  test('should reject activity with non-integer value', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const dataWithFloatValue = {
      version: '1.0',
      positive: {
        activities: [
          {
            id: '1',
            name: 'Test Activity',
            value: 3.5, // Invalid: not an integer
          },
        ],
      },
    };

    expect(() => StorageManager.import(JSON.stringify(dataWithFloatValue))).toThrow('Energieniveau muss eine ganze Zahl sein');

    console.error = originalError;
  });

  test('should accept valid activities with values 1-5', () => {
    const validData = {
      version: '1.0',
      positive: {
        activities: [
          { id: '1', name: 'Activity 1', value: 1 },
          { id: '2', name: 'Activity 2', value: 5 },
          { id: '3', name: 'Activity 3', value: 5 },
        ],
      },
      negative: {
        activities: [
          { id: '4', name: 'Activity 4', value: 3 },
          { id: '5', name: 'Activity 5', value: 4 },
        ],
      },
    };

    const result = StorageManager.import(JSON.stringify(validData));
    expect(result.positive.activities).toHaveLength(3);
    expect(result.negative.activities).toHaveLength(2);
    expect(result.positive.activities[0].value).toBe(1);
    expect(result.positive.activities[2].value).toBe(5);
  });

  test('should clear localStorage when loading data with invalid activity value', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidData = {
      version: '1.0',
      positive: {
        activities: [
          { id: '1', name: 'Test Activity', value: 10 }, // Invalid value
        ],
      },
      negative: {
        activities: [],
      },
    };

    localStorage.setItem('energiekuchen-data', JSON.stringify(invalidData));
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
    // Verify localStorage was cleared
    expect(localStorage.getItem('energiekuchen-data')).toBeNull();

    console.error = originalError;
  });

  test('should clear localStorage when loading data with missing activity name', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidData = {
      version: '1.0',
      positive: {
        activities: [
          { id: '1', name: '', value: 3 }, // Empty name
        ],
      },
      negative: {
        activities: [],
      },
    };

    localStorage.setItem('energiekuchen-data', JSON.stringify(invalidData));
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
    // Verify localStorage was cleared
    expect(localStorage.getItem('energiekuchen-data')).toBeNull();

    console.error = originalError;
  });

  test('should clear localStorage when loading data with non-integer value', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidData = {
      version: '1.0',
      positive: {
        activities: [
          { id: '1', name: 'Test', value: 3.5 }, // Non-integer value
        ],
      },
      negative: {
        activities: [],
      },
    };

    localStorage.setItem('energiekuchen-data', JSON.stringify(invalidData));
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
    // Verify localStorage was cleared
    expect(localStorage.getItem('energiekuchen-data')).toBeNull();

    console.error = originalError;
  });

  test('should successfully load valid data from localStorage', () => {
    const validData = {
      version: '1.0',
      positive: {
        activities: [{ id: '1', name: 'Activity 1', value: 3 }],
      },
      negative: {
        activities: [{ id: '2', name: 'Activity 2', value: 4 }],
      },
    };

    localStorage.setItem('energiekuchen-data', JSON.stringify(validData));
    const loaded = StorageManager.load();
    expect(loaded).toEqual(validData);
    // Verify localStorage was NOT cleared
    expect(localStorage.getItem('energiekuchen-data')).not.toBeNull();
  });
});
