import { act, renderHook } from '@testing-library/react';
import { createMockActivity } from '../../../__tests__/utils/mocks';
import { StorageManager } from '../../utils/storage';
import { EnergyProvider, useEnergy } from '../EnergyContext';

// Mock StorageManager
jest.mock('../../utils/storage', () => ({
  StorageManager: {
    save: jest.fn(),
    load: jest.fn(() => null),
    import: jest.fn(),
    export: jest.fn(() => '{}'),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => <EnergyProvider>{children}</EnergyProvider>;

describe('EnergyContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();

    // Reset StorageManager mocks to default behavior
    jest.mocked(StorageManager.load).mockReturnValue(null);
    jest.mocked(StorageManager.import).mockImplementation((jsonString: string) => JSON.parse(jsonString));
  });
  test('should add activity to positive chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Sport');
  });

  test('should add activity to negative chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('negative', {
        name: 'Stress',
        value: 30,
        color: '#EF4444',
      });
    });

    expect(result.current.state.data.negative.activities).toHaveLength(1);
    expect(result.current.state.data.negative.activities[0].name).toBe('Stress');
  });

  test('should update activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    const activityId = result.current.state.data.positive.activities[0].id;

    act(() => {
      result.current.updateActivity('positive', activityId, { name: 'Fitness' });
    });

    expect(result.current.state.data.positive.activities[0].name).toBe('Fitness');
  });

  test('should delete activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    const activityId = result.current.state.data.positive.activities[0].id;

    act(() => {
      result.current.deleteActivity('positive', activityId);
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
  });

  test('should reorder activities correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Lesen',
        value: 30,
        color: '#34D399',
      });
    });

    expect(result.current.state.data.positive.activities[0].name).toBe('Sport');
    expect(result.current.state.data.positive.activities[1].name).toBe('Lesen');

    act(() => {
      result.current.reorderActivities('positive', 0, 1);
    });

    expect(result.current.state.data.positive.activities[0].name).toBe('Lesen');
    expect(result.current.state.data.positive.activities[1].name).toBe('Sport');
  });

  test('should update chart size', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.updateChartSize('positive', 'large');
    });

    expect(result.current.state.data.positive.size).toBe('large');
  });

  test('should update settings', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.updateSettings({ showTooltips: false });
    });

    expect(result.current.state.data.settings.showTooltips).toBe(false);
  });

  test('should reset data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);

    act(() => {
      result.current.resetData();
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);
  });

  test('should import data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    const importData = JSON.stringify({
      version: '1.0',
      lastModified: new Date().toISOString(),
      positive: {
        id: 'positive',
        type: 'positive',
        activities: [createMockActivity({ name: 'Imported Activity' })],
        size: 'medium',
      },
      negative: {
        id: 'negative',
        type: 'negative',
        activities: [],
        size: 'medium',
      },
      settings: {
        chartSize: 'medium',
        colorScheme: 'default',
        showTooltips: true,
        showLegends: true,
        language: 'de',
      },
    });

    const mockData = JSON.parse(importData);
    jest.mocked(StorageManager.import).mockReturnValue(mockData);

    act(() => {
      result.current.importData(importData);
    });

    expect(StorageManager.import).toHaveBeenCalledWith(importData);
  });

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      renderHook(() => useEnergy());
    }).toThrow('useEnergy must be used within an EnergyProvider');

    console.error = originalError;
  });

  test('should update chart size correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.updateChartSize('positive', 'large');
    });

    expect(result.current.state.data.positive.size).toBe('large');
  });

  test('should update global settings correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.updateSettings({ chartSize: 'large', showTooltips: false });
    });

    expect(result.current.state.data.settings.chartSize).toBe('large');
    expect(result.current.state.data.settings.showTooltips).toBe(false);
  });

  test('should reset all data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some activities first
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
      result.current.addActivity('negative', {
        name: 'Stress',
        value: 30,
        color: '#EF4444',
      });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.negative.activities).toHaveLength(1);

    act(() => {
      result.current.resetData();
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);
  });

  test('should handle invalid chart type in addActivity', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // This should not crash, but may not add the activity
    act(() => {
      result.current.addActivity('invalid' as 'positive', {
        name: 'Test',
        value: 50,
        color: '#10B981',
      });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);
  });

  test('should handle updateActivity with non-existent activity ID', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // This should not crash
    act(() => {
      result.current.updateActivity('positive', 'non-existent-id', { name: 'Updated' });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
  });

  test('should handle deleteActivity with non-existent activity ID', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // This should not crash
    act(() => {
      result.current.deleteActivity('positive', 'non-existent-id');
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
  });

  test('should handle importData with invalid JSON', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Mock StorageManager.import to throw for invalid JSON
    jest.mocked(StorageManager.import).mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      act(() => {
        result.current.importData('invalid json');
      });
    }).toThrow();

    console.error = originalError;
  });

  test('should handle importData with missing required fields', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    const invalidData = JSON.stringify({
      version: '1.0',
      // Missing positive, negative, settings
    });

    // Mock StorageManager.import to throw for missing fields
    jest.mocked(StorageManager.import).mockImplementation(() => {
      throw new Error('Missing required fields');
    });

    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      act(() => {
        result.current.importData(invalidData);
      });
    }).toThrow();

    console.error = originalError;
  });

  test('should handle reorderActivities with invalid indices', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add one activity
    act(() => {
      result.current.addActivity('positive', { name: 'Test', value: 50, color: '#10B981' });
    });

    // Try to reorder with invalid indices - should not crash
    act(() => {
      result.current.reorderActivities('positive', 0, 5); // destination index out of bounds
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Test');
  });

  test('should save data using saveData method', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981',
      });
    });

    // Manually call saveData to test the functionality
    act(() => {
      result.current.saveData();
    });

    // Check that StorageManager.save was called
    expect(StorageManager.save).toHaveBeenCalled();
  });
});
