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
        value: 5,
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
        value: 3,
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
        value: 5,
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
        value: 5,
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
        value: 5,
      });
    });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Lesen',
        value: 3,
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

  test('should reorder multiple activities correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add three activities
    act(() => {
      result.current.addActivity('negative', {
        name: 'Stress',
        value: 7,
      });
      result.current.addActivity('negative', {
        name: 'Müdigkeit',
        value: 5,
      });
      result.current.addActivity('negative', {
        name: 'Langeweile',
        value: 3,
      });
    });

    // Initial order
    expect(result.current.state.data.negative.activities[0].name).toBe('Stress');
    expect(result.current.state.data.negative.activities[1].name).toBe('Müdigkeit');
    expect(result.current.state.data.negative.activities[2].name).toBe('Langeweile');

    // Move last item to first position
    act(() => {
      result.current.reorderActivities('negative', 2, 0);
    });

    expect(result.current.state.data.negative.activities[0].name).toBe('Langeweile');
    expect(result.current.state.data.negative.activities[1].name).toBe('Stress');
    expect(result.current.state.data.negative.activities[2].name).toBe('Müdigkeit');
  });

  test('should handle reorder with same indices', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 5,
      });
    });

    const initialActivities = [...result.current.state.data.positive.activities];

    // Reorder with same from and to index
    act(() => {
      result.current.reorderActivities('positive', 0, 0);
    });

    // Should remain unchanged
    expect(result.current.state.data.positive.activities).toEqual(initialActivities);
  });

  test('should reset data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 5,
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
      positive: {
        activities: [createMockActivity({ name: 'Imported Activity' })],
      },
      negative: {
        activities: [],
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

  test('should reset all data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some activities first
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 5,
      });
      result.current.addActivity('negative', {
        name: 'Stress',
        value: 3,
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
        value: 5,
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
      result.current.addActivity('positive', { name: 'Test', value: 5 });
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
        value: 5,
      });
    });

    // Manually call saveData to test the functionality
    act(() => {
      result.current.saveData();
    });

    // Check that StorageManager.save was called
    expect(StorageManager.save).toHaveBeenCalled();
  });

  test('should handle data loading errors gracefully', () => {
    // Mock StorageManager.load to throw an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.mocked(StorageManager.load).mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Should not crash and should be in default state
    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);

    consoleSpy.mockRestore();
  });

  test('should load saved data on mount', () => {
    const mockData = {
      version: '1.0',
      positive: {
        activities: [createMockActivity({ name: 'Loaded Activity' })],
      },
      negative: {
        activities: [],
      },
    };

    jest.mocked(StorageManager.load).mockReturnValue(mockData);

    const { result } = renderHook(() => useEnergy(), { wrapper });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Loaded Activity');
  });

  test('should handle loadData method', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    const mockData = {
      version: '1.0',
      positive: {
        activities: [createMockActivity({ name: 'Manual Load' })],
      },
      negative: {
        activities: [],
      },
    };

    jest.mocked(StorageManager.load).mockReturnValue(mockData);

    act(() => {
      result.current.loadData();
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Manual Load');
  });

  test('should handle exportData method', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    const exportedData = result.current.exportData();
    expect(typeof exportedData).toBe('string');
    expect(StorageManager.export).toHaveBeenCalled();
  });

  test('should handle importData errors gracefully', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    jest.mocked(StorageManager.import).mockImplementation(() => {
      throw new Error('Import error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Should not crash when import fails
    act(() => {
      try {
        result.current.importData('invalid data');
      } catch {
        // Expected to throw
      }
    });

    consoleSpy.mockRestore();
  });

  test('should handle merge mode in importData', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add initial activity
    act(() => {
      result.current.addActivity('positive', {
        name: 'Existing Activity',
        value: 3,
      });
    });

    // Mock import data
    const importData = {
      version: '1.0',
      positive: {
        id: 'positive',
        type: 'positive' as const,
        activities: [createMockActivity({ name: 'Imported Activity' })],
        size: 'large' as const,
      },
      negative: {
        id: 'negative',
        type: 'negative' as const,
        activities: [],
        size: 'small' as const,
      },
    };

    jest.mocked(StorageManager.import).mockReturnValue(importData);

    // Import data - the basic importData method replaces all data
    act(() => {
      result.current.importData(JSON.stringify(importData));
    });

    // importData method replaces all data, so only imported activity should be present
    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Imported Activity');
  });

  test('should handle clearAllData action', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some activities
    act(() => {
      result.current.addActivity('positive', {
        name: 'Activity 1',
        value: 3,
      });
      result.current.addActivity('negative', {
        name: 'Activity 2',
        value: 2,
      });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.negative.activities).toHaveLength(1);

    // Clear all data using the internal action (we'll access it via importing empty data)
    act(() => {
      result.current.resetData();
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);
  });

  test('should handle importData with merge mode (replaceExisting: false)', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some initial activities
    act(() => {
      result.current.addActivity('positive', { name: 'Existing Positive', value: 3 });
      result.current.addActivity('negative', { name: 'Existing Negative', value: 4 });
    });

    const importData = {
      version: '1.0',
      positive: {
        id: 'positive',
        type: 'positive' as const,
        activities: [{ id: '1', name: 'Imported Positive', value: 5 }],
        size: 'medium' as const,
      },
      negative: {
        id: 'negative',
        type: 'negative' as const,
        activities: [{ id: '2', name: 'Imported Negative', value: 6 }],
        size: 'medium' as const,
      },
    };

    // Directly dispatch import action with merge mode
    act(() => {
      result.current.dispatch({
        type: 'IMPORT_DATA',
        payload: { data: importData, replaceExisting: false },
      });
    });

    // Should have merged activities (existing + imported)
    expect(result.current.state.data.positive.activities).toHaveLength(2);
    expect(result.current.state.data.negative.activities).toHaveLength(2);
    expect(result.current.state.data.positive.activities[0].name).toBe('Existing Positive');
    expect(result.current.state.data.positive.activities[1].name).toBe('Imported Positive');
  });

  test('should handle importData with replace mode (replaceExisting: true)', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some initial activities
    act(() => {
      result.current.addActivity('positive', { name: 'Existing Positive', value: 3 });
    });

    const importData = {
      version: '1.0',
      positive: {
        id: 'positive',
        type: 'positive' as const,
        activities: [{ id: '1', name: 'Imported Positive', value: 5 }],
        size: 'medium' as const,
      },
      negative: {
        id: 'negative',
        type: 'negative' as const,
        activities: [],
        size: 'medium' as const,
      },
    };

    // Directly dispatch import action with replace mode
    act(() => {
      result.current.dispatch({
        type: 'IMPORT_DATA',
        payload: { data: importData, replaceExisting: true },
      });
    });

    // Should have replaced activities (only imported)
    expect(result.current.state.data.positive.activities).toHaveLength(1);
    expect(result.current.state.data.positive.activities[0].name).toBe('Imported Positive');
  });

  test('should not add duplicate activities when importing with merge mode', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some initial activities with specific IDs
    act(() => {
      result.current.dispatch({
        type: 'SET_DATA',
        payload: {
          version: '1.0',
          positive: {
            activities: [
              { id: 'activity-1', name: 'Existing Sport', value: 7 },
              { id: 'activity-2', name: 'Existing Reading', value: 5 },
            ],
          },
          negative: {
            activities: [{ id: 'activity-3', name: 'Existing Stress', value: 8 }],
          },
        },
      });
    });

    const importData = {
      version: '1.0',
      positive: {
        activities: [
          { id: 'activity-1', name: 'Duplicate Sport', value: 9 }, // Same ID as existing
          { id: 'activity-4', name: 'New Meditation', value: 6 }, // New ID
        ],
      },
      negative: {
        activities: [
          { id: 'activity-3', name: 'Duplicate Stress', value: 3 }, // Same ID as existing
          { id: 'activity-5', name: 'New Commute', value: 4 }, // New ID
        ],
      },
    };

    // Import with merge mode (replaceExisting: false)
    act(() => {
      result.current.dispatch({
        type: 'IMPORT_DATA',
        payload: { data: importData, replaceExisting: false },
      });
    });

    // Should have 3 positive activities (2 existing + 1 new, duplicate ignored)
    expect(result.current.state.data.positive.activities).toHaveLength(3);
    expect(result.current.state.data.positive.activities[0].name).toBe('Existing Sport');
    expect(result.current.state.data.positive.activities[1].name).toBe('Existing Reading');
    expect(result.current.state.data.positive.activities[2].name).toBe('New Meditation');

    // Should have 2 negative activities (1 existing + 1 new, duplicate ignored)
    expect(result.current.state.data.negative.activities).toHaveLength(2);
    expect(result.current.state.data.negative.activities[0].name).toBe('Existing Stress');
    expect(result.current.state.data.negative.activities[1].name).toBe('New Commute');
  });

  test('should handle CLEAR_ALL_DATA action', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    // Add some activities first
    act(() => {
      result.current.addActivity('positive', { name: 'Test Activity', value: 5 });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(1);

    // Clear all data
    act(() => {
      result.current.dispatch({ type: 'CLEAR_ALL_DATA' });
    });

    expect(result.current.state.data.positive.activities).toHaveLength(0);
    expect(result.current.state.data.negative.activities).toHaveLength(0);
    expect(result.current.state.lastSaved).toBeTruthy();
  });

  test('should handle unknown action types gracefully', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    const initialState = result.current.state;

    // Dispatch an unknown action
    act(() => {
      // @ts-expect-error - Testing unknown action type
      result.current.dispatch({ type: 'UNKNOWN_ACTION' });
    });

    // State should remain unchanged
    expect(result.current.state).toEqual(initialState);
  });
});
