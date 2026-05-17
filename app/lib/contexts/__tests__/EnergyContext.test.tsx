import { act, renderHook } from '@testing-library/react';

import { createMockActivity } from '../../../__tests__/utils/mocks';
import { StorageManager } from '../../utils/storage';
import { EnergyProvider, useEnergy } from '../EnergyContext';

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
    localStorage.clear();
    jest.mocked(StorageManager.load).mockReturnValue(null);
    jest.mocked(StorageManager.import).mockImplementation((jsonString: string) => JSON.parse(jsonString));
  });

  test('should add activity to current chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('current', { name: 'Sport', weight: 5, polarity: 'positive' });
    });

    expect(result.current.state.data.current.activities).toHaveLength(1);
    expect(result.current.state.data.current.activities[0].name).toBe('Sport');
  });

  test('should add activity to desired chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });

    act(() => {
      result.current.addActivity('desired', { name: 'Mehr Sport', weight: 3, polarity: 'positive' });
    });

    expect(result.current.state.data.desired.activities).toHaveLength(1);
  });

  test('should update activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Sport', weight: 5, polarity: 'positive' });
    });
    const id = result.current.state.data.current.activities[0].id;
    act(() => {
      result.current.updateActivity('current', id, { name: 'Fitness' });
    });
    expect(result.current.state.data.current.activities[0].name).toBe('Fitness');
  });

  test('should delete activity correctly and renormalize', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'A', weight: 5, polarity: 'positive' });
      result.current.addActivity('current', { name: 'B', weight: 5, polarity: 'positive' });
    });
    const id = result.current.state.data.current.activities[0].id;
    act(() => {
      result.current.deleteActivity('current', id);
    });
    expect(result.current.state.data.current.activities).toHaveLength(1);
  });

  test('should reorder activities correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Sport', weight: 5, polarity: 'positive' });
      result.current.addActivity('current', { name: 'Lesen', weight: 3, polarity: 'positive' });
    });
    act(() => {
      result.current.reorderActivities('current', 0, 1);
    });
    expect(result.current.state.data.current.activities[0].name).toBe('Lesen');
  });

  test('SET_ACTIVITY_WEIGHTS updates matched ids', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'A', weight: 4, polarity: 'positive' });
      result.current.addActivity('current', { name: 'B', weight: 4, polarity: 'positive' });
    });
    const ids = result.current.state.data.current.activities.map(a => a.id);
    act(() => {
      result.current.setActivityWeights('current', [
        { id: ids[0], weight: 6 },
        { id: 'missing', weight: 99 },
      ]);
    });
    expect(result.current.state.data.current.activities[0].weight).toBe(6);
    expect(result.current.state.data.current.activities[1].weight).toBe(4);
  });

  test('TOGGLE_POLARITY inserts after last destination-polarity activity (non-empty)', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'P1', weight: 4, polarity: 'positive' });
      result.current.addActivity('current', { name: 'P2', weight: 4, polarity: 'positive' });
      result.current.addActivity('current', { name: 'N1', weight: 4, polarity: 'negative' });
    });
    const p1Id = result.current.state.data.current.activities[0].id;
    const weightsBefore = result.current.state.data.current.activities.map(a => a.weight);
    act(() => {
      result.current.togglePolarity('current', p1Id);
    });
    const activities = result.current.state.data.current.activities;
    expect(activities.map(a => a.name)).toEqual(['P2', 'N1', 'P1']);
    expect(activities.find(a => a.name === 'P1')?.polarity).toBe('negative');
    // Renormalization should NOT have run (non-empty destination): weights unchanged.
    expect(activities.map(a => a.weight)).toEqual(weightsBefore);
  });

  test('TOGGLE_POLARITY into empty destination (negative) places after positives', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'P1', weight: 4, polarity: 'positive' });
      result.current.addActivity('current', { name: 'P2', weight: 4, polarity: 'positive' });
    });
    const p1Id = result.current.state.data.current.activities[0].id;
    act(() => {
      result.current.togglePolarity('current', p1Id);
    });
    const names = result.current.state.data.current.activities.map(a => a.name);
    expect(names).toEqual(['P2', 'P1']);
    expect(result.current.state.data.current.activities[1].polarity).toBe('negative');
  });

  test('TOGGLE_POLARITY into empty destination (positive) places at index 0', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'N1', weight: 4, polarity: 'negative' });
      result.current.addActivity('current', { name: 'N2', weight: 4, polarity: 'negative' });
    });
    const n1Id = result.current.state.data.current.activities[0].id;
    act(() => {
      result.current.togglePolarity('current', n1Id);
    });
    const activities = result.current.state.data.current.activities;
    expect(activities[0].name).toBe('N1');
    expect(activities[0].polarity).toBe('positive');
  });

  test('should reset data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Sport', weight: 5, polarity: 'positive' });
    });
    act(() => {
      result.current.resetData();
    });
    expect(result.current.state.data.current.activities).toHaveLength(0);
  });

  test('should import data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    const payload = JSON.stringify({
      version: '3.0',
      current: { activities: [createMockActivity({ name: 'Imported' })] },
      desired: { activities: [] },
    });
    jest.mocked(StorageManager.import).mockReturnValue(JSON.parse(payload));
    act(() => {
      result.current.importData(payload);
    });
    expect(StorageManager.import).toHaveBeenCalledWith(payload);
  });

  test('should throw error when used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => renderHook(() => useEnergy())).toThrow('useEnergy must be used within an EnergyProvider');
    console.error = originalError;
  });

  test('handles importData failure', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    jest.mocked(StorageManager.import).mockImplementation(() => {
      throw new Error('boom');
    });
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      act(() => {
        result.current.importData('x');
      });
    }).toThrow();
    consoleSpy.mockRestore();
  });

  test('save and load proxies', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'A', weight: 4, polarity: 'positive' });
    });
    act(() => {
      result.current.saveData();
    });
    expect(StorageManager.save).toHaveBeenCalled();

    jest.mocked(StorageManager.load).mockReturnValue({
      version: '3.0',
      current: { activities: [createMockActivity({ name: 'Loaded' })] },
      desired: { activities: [] },
    });
    act(() => {
      result.current.loadData();
    });
    expect(result.current.state.data.current.activities.find(a => a.name === 'Loaded')).toBeDefined();
  });

  test('loadData on mount', () => {
    jest.mocked(StorageManager.load).mockReturnValue({
      version: '3.0',
      current: { activities: [createMockActivity({ name: 'Auto' })] },
      desired: { activities: [] },
    });
    const { result } = renderHook(() => useEnergy(), { wrapper });
    expect(result.current.state.data.current.activities[0].name).toBe('Auto');
  });

  test('exportData delegates to StorageManager', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    const exported = result.current.exportData();
    expect(typeof exported).toBe('string');
    expect(StorageManager.export).toHaveBeenCalled();
  });

  test('copyActivitiesFromCurrent', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'A', weight: 4, polarity: 'positive' });
      result.current.addActivity('current', { name: 'B', weight: 4, polarity: 'negative' });
    });
    act(() => {
      result.current.copyActivitiesFromCurrent();
    });
    expect(result.current.state.data.desired.activities).toHaveLength(2);
    const currentIds = new Set(result.current.state.data.current.activities.map(a => a.id));
    for (const a of result.current.state.data.desired.activities) {
      expect(currentIds.has(a.id)).toBe(false);
    }
  });

  test('IMPORT_DATA merge mode renormalizes both charts', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Existing', weight: 4, polarity: 'positive' });
    });
    const importedData = {
      version: '3.0' as const,
      current: { activities: [{ id: 'new', name: 'New', weight: 6, polarity: 'positive' as const }] },
      desired: { activities: [] },
    };
    act(() => {
      result.current.dispatch({ type: 'IMPORT_DATA', payload: { data: importedData, replaceExisting: false } });
    });
    expect(result.current.state.data.current.activities).toHaveLength(2);
  });

  test('IMPORT_DATA merge mode skips duplicate ids', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.dispatch({
        type: 'SET_DATA',
        payload: {
          version: '3.0',
          current: { activities: [{ id: 'shared', name: 'Existing', weight: 4, polarity: 'positive' }] },
          desired: { activities: [] },
        },
      });
    });
    const importedData = {
      version: '3.0' as const,
      current: { activities: [{ id: 'shared', name: 'Duplicate', weight: 6, polarity: 'positive' as const }] },
      desired: { activities: [] },
    };
    act(() => {
      result.current.dispatch({ type: 'IMPORT_DATA', payload: { data: importedData, replaceExisting: false } });
    });
    expect(result.current.state.data.current.activities).toHaveLength(1);
    expect(result.current.state.data.current.activities[0].name).toBe('Existing');
  });

  test('ADD_ACTIVITY renormalizes weights so every slice respects the floor', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.dispatch({
        type: 'SET_DATA',
        payload: {
          version: '3.0',
          current: { activities: [{ id: '1', name: 'Big', weight: 100, polarity: 'positive' }] },
          desired: { activities: [] },
        },
      });
    });
    act(() => {
      result.current.addActivity('current', { name: 'Tiny', weight: 0.001, polarity: 'positive' });
    });
    const activities = result.current.state.data.current.activities;
    const total = activities.reduce((s, a) => s + a.weight, 0);
    const floor = Math.max(0.01, Math.ceil(total * 0.01 * 100) / 100);
    for (const a of activities) {
      expect(a.weight).toBeGreaterThanOrEqual(floor);
    }
  });

  test('IMPORT_DATA replace mode wipes existing activities', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Existing', weight: 4, polarity: 'positive' });
    });
    const importedData = {
      version: '3.0' as const,
      current: { activities: [{ id: 'new', name: 'New', weight: 6, polarity: 'negative' as const }] },
      desired: { activities: [] },
    };
    act(() => {
      result.current.dispatch({ type: 'IMPORT_DATA', payload: { data: importedData, replaceExisting: true } });
    });
    expect(result.current.state.data.current.activities).toHaveLength(1);
    expect(result.current.state.data.current.activities[0].name).toBe('New');
  });

  test('TOGGLE_POLARITY is a no-op for a missing activity id', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'Sport', weight: 4, polarity: 'positive' });
    });
    const before = result.current.state.data.current.activities;
    act(() => {
      result.current.togglePolarity('current', 'does-not-exist');
    });
    expect(result.current.state.data.current.activities).toBe(before);
  });

  test('loadData with null return leaves state unchanged', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    jest.mocked(StorageManager.load).mockReturnValue(null);
    const before = result.current.state.data;
    act(() => {
      result.current.loadData();
    });
    expect(result.current.state.data).toBe(before);
  });

  test('CLEAR_ALL_DATA resets to default', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    act(() => {
      result.current.addActivity('current', { name: 'X', weight: 4, polarity: 'positive' });
    });
    act(() => {
      result.current.dispatch({ type: 'CLEAR_ALL_DATA' });
    });
    expect(result.current.state.data.current.activities).toHaveLength(0);
    expect(result.current.state.lastSaved).toBeTruthy();
  });

  test('unknown action keeps state', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper });
    const before = result.current.state;
    act(() => {
      // @ts-expect-error - testing unknown action
      result.current.dispatch({ type: 'UNKNOWN_ACTION' });
    });
    expect(result.current.state).toEqual(before);
  });
});
