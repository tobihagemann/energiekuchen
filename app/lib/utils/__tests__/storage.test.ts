import { createMockEnergyPie } from '../../../__tests__/utils/mocks';
import { exportData, importData, StorageManager, toV3Serializable } from '../storage';

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
    expect(imported).toEqual(mockData);
  });

  test('should throw error for invalid import data', () => {
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

  test('should handle localStorage save errors gracefully', () => {
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = jest.fn(() => {
      throw new Error('Storage quota exceeded');
    });
    const originalError = console.error;
    console.error = jest.fn();

    const mockData = createMockEnergyPie();
    expect(() => StorageManager.save(mockData)).toThrow('Daten konnten nicht gespeichert werden');

    localStorage.setItem = originalSetItem;
    console.error = originalError;
  });

  test('should throw error when no data to export', () => {
    expect(() => StorageManager.export()).toThrow('Keine Daten zum Exportieren vorhanden');
  });

  test('should throw on missing activity name during import', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const invalid = { version: '3.0', current: { activities: [{ id: '1', weight: 4, polarity: 'positive' }] }, desired: { activities: [] } };
    expect(() => importData(JSON.stringify(invalid))).toThrow('Aktivitätsname ist erforderlich');
    console.error = originalError;
  });

  test('should throw on v3 payload missing weight/polarity', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const invalid = { version: '3.0', current: { activities: [{ id: '1', name: 'A' }] }, desired: { activities: [] } };
    expect(() => importData(JSON.stringify(invalid))).toThrow('Aktivität muss Gewicht und Polarität haben');
    console.error = originalError;
  });

  test('should handle corrupted JSON in localStorage', () => {
    localStorage.setItem('energiekuchen-data', '{"invalid": json}');
    const originalError = console.error;
    console.error = jest.fn();
    const loaded = StorageManager.load();
    expect(loaded).toBeNull();
    expect(localStorage.getItem('energiekuchen-data')).toBeNull();
    console.error = originalError;
  });

  test('should export valid JSON with formatting', () => {
    const mockData = createMockEnergyPie();
    StorageManager.save(mockData);
    const exported = StorageManager.export();
    expect(() => JSON.parse(exported)).not.toThrow();
    expect(exported).toContain('\n');
  });

  test('empty string import throws', () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => importData('')).toThrow('Ungültige Datei oder Datenformat');
    console.error = originalError;
  });

  test('payload with no current and no desired throws', () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => importData(JSON.stringify({ version: null }))).toThrow('keine Aktivitätsdaten gefunden');
    console.error = originalError;
  });

  test('should treat non-array activities as empty', () => {
    const result = StorageManager.import(JSON.stringify({ version: '2.0', current: { activities: 'oops' }, desired: { activities: [] } }));
    expect(result.current.activities).toEqual([]);
    expect(result.version).toBe('3.0');
  });

  test('v1 → v3 migration', () => {
    const v1 = {
      version: '1.0',
      positive: { activities: [{ id: '1', name: 'Energy Giving', value: 3 }] },
      negative: { activities: [{ id: '2', name: 'Energy Draining', value: 2 }] },
    };
    const result = StorageManager.import(JSON.stringify(v1));
    expect(result.version).toBe('3.0');
    expect(result.current.activities).toHaveLength(2);
    const giving = result.current.activities.find(a => a.name === 'Energy Giving');
    const draining = result.current.activities.find(a => a.name === 'Energy Draining');
    expect(giving?.polarity).toBe('positive');
    expect(giving?.weight).toBe(Math.pow(2, 3 - 1));
    expect(draining?.polarity).toBe('negative');
    expect(draining?.weight).toBe(Math.pow(2, 2 - 1));
    expect(result.desired.activities).toHaveLength(0);
  });

  test('v2 → v3 migration both polarities', () => {
    const v2 = {
      version: '2.0',
      current: { activities: [{ id: '1', name: 'Sport', value: 5 }] },
      desired: { activities: [{ id: '2', name: 'Stress', value: -3 }] },
    };
    const result = StorageManager.import(JSON.stringify(v2));
    expect(result.version).toBe('3.0');
    expect(result.current.activities[0].weight).toBe(Math.pow(2, 4));
    expect(result.current.activities[0].polarity).toBe('positive');
    expect(result.desired.activities[0].weight).toBe(Math.pow(2, 2));
    expect(result.desired.activities[0].polarity).toBe('negative');
  });

  test('v2 → v3 drops legacy entries with invalid value and warns', () => {
    const originalWarn = console.warn;
    console.warn = jest.fn();
    const v2 = {
      version: '2.0',
      current: {
        activities: [
          { id: '1', name: 'Valid', value: 3 },
          { id: '2', name: 'Zero', value: 0 },
          { id: '3', name: 'Too High', value: 6 },
        ],
      },
      desired: { activities: [] },
    };
    const result = StorageManager.import(JSON.stringify(v2));
    expect(result.current.activities).toHaveLength(1);
    expect(result.current.activities[0].name).toBe('Valid');
    expect(console.warn).toHaveBeenCalled();
    console.warn = originalWarn;
  });

  test('mixed payload: v2 entry migrates, v3 entry survives', () => {
    const mixed = {
      current: {
        activities: [
          { id: '1', name: 'Legacy', value: 2 },
          { id: '2', name: 'Modern', weight: 7, polarity: 'negative' },
        ],
      },
      desired: { activities: [] },
    };
    const result = StorageManager.import(JSON.stringify(mixed));
    expect(result.version).toBe('3.0');
    const legacy = result.current.activities.find(a => a.name === 'Legacy');
    const modern = result.current.activities.find(a => a.name === 'Modern');
    expect(legacy?.weight).toBe(2);
    expect(legacy?.polarity).toBe('positive');
    expect(modern?.weight).toBe(7);
    expect(modern?.polarity).toBe('negative');
  });

  test('empty-arrays v2 payload migrates to v3 with empty arrays', () => {
    const v2 = { version: '2.0', current: { activities: [] }, desired: { activities: [] } };
    const result = StorageManager.import(JSON.stringify(v2));
    expect(result.version).toBe('3.0');
    expect(result.current.activities).toHaveLength(0);
    expect(result.desired.activities).toHaveLength(0);
  });

  test('load migrates v2 and writes back; second load does not re-save', () => {
    const v2 = {
      version: '2.0',
      current: { activities: [{ id: '1', name: 'Sport', value: 3 }] },
      desired: { activities: [] },
    };
    localStorage.setItem('energiekuchen-data', JSON.stringify(v2));

    const firstLoad = StorageManager.load();
    expect(firstLoad?.version).toBe('3.0');
    const stored = JSON.parse(localStorage.getItem('energiekuchen-data') as string);
    expect(stored.version).toBe('3.0');
    expect(stored.current.activities[0].weight).toBe(4);

    const saveSpy = jest.spyOn(StorageManager, 'save');
    StorageManager.load();
    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  test('tiny-weight import round-trip preservation', () => {
    const tiny = {
      version: '3.0',
      current: {
        activities: [
          { id: '1', name: 'A', weight: 0.001, polarity: 'positive' },
          { id: '2', name: 'B', weight: 0.002, polarity: 'positive' },
          { id: '3', name: 'C', weight: 0.003, polarity: 'positive' },
        ],
      },
      desired: { activities: [] },
    };
    const result = StorageManager.import(JSON.stringify(tiny));
    const total = result.current.activities.reduce((s, a) => s + a.weight, 0);
    for (const a of result.current.activities) {
      expect(a.weight).toBeGreaterThanOrEqual(Math.max(0.01, total * 0.01));
    }
  });

  test('rejects v3 weight of zero', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const v3 = {
      version: '3.0',
      current: { activities: [{ id: '1', name: 'X', weight: 0, polarity: 'positive' }] },
      desired: { activities: [] },
    };
    expect(() => importData(JSON.stringify(v3))).toThrow(/Gewicht/);
    console.error = originalError;
  });

  test('rejects v3 negative weight', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const v3 = {
      version: '3.0',
      current: { activities: [{ id: '1', name: 'X', weight: -5, polarity: 'positive' }] },
      desired: { activities: [] },
    };
    expect(() => importData(JSON.stringify(v3))).toThrow(/Gewicht/);
    console.error = originalError;
  });

  test('rejects v3 weight above the 10000 cap', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const v3 = {
      version: '3.0',
      current: { activities: [{ id: '1', name: 'X', weight: 99999, polarity: 'positive' }] },
      desired: { activities: [] },
    };
    expect(() => importData(JSON.stringify(v3))).toThrow(/Gewicht/);
    console.error = originalError;
  });

  test('preserves a valid v3 labelOffset', () => {
    const v3 = {
      version: '3.0',
      current: { activities: [{ id: '1', name: 'X', weight: 4, polarity: 'positive', labelOffset: { radial: 0.2, angular: 1 } }] },
      desired: { activities: [] },
    };
    const result = importData(JSON.stringify(v3));
    expect(result.current.activities[0].labelOffset).toEqual({ radial: 0.2, angular: 1 });
  });

  test('drops malformed labelOffset in v3 payload', () => {
    const v3 = {
      version: '3.0',
      current: { activities: [{ id: '1', name: 'X', weight: 4, polarity: 'positive', labelOffset: { radial: NaN, angular: 0 } }] },
      desired: { activities: [] },
    };
    const result = importData(JSON.stringify(v3));
    expect(result.current.activities[0].labelOffset).toBeUndefined();
  });

  test('drops v2 activity missing both weight and value', () => {
    const originalWarn = console.warn;
    console.warn = jest.fn();
    const v2 = {
      version: '2.0',
      current: { activities: [{ id: '1', name: 'Empty' }] },
      desired: { activities: [] },
    };
    const result = importData(JSON.stringify(v2));
    expect(result.current.activities).toHaveLength(0);
    expect(console.warn).toHaveBeenCalled();
    console.warn = originalWarn;
  });

  test('write-back swallow: quota errors do not crash load', () => {
    const v2 = {
      version: '2.0',
      current: { activities: [{ id: '1', name: 'Sport', value: 3 }] },
      desired: { activities: [] },
    };
    localStorage.setItem('energiekuchen-data', JSON.stringify(v2));

    const originalSetItem = localStorage.setItem;
    const originalError = console.error;
    console.error = jest.fn();
    let callCount = 0;
    localStorage.setItem = jest.fn((key: string, value: string) => {
      callCount++;
      if (callCount === 1) throw new Error('quota');
      return originalSetItem.call(localStorage, key, value);
    }) as typeof localStorage.setItem;

    const loaded = StorageManager.load();
    expect(loaded?.version).toBe('3.0');

    localStorage.setItem = originalSetItem;
    console.error = originalError;
  });

  test('load returns null when getItem throws', () => {
    const originalGetItem = localStorage.getItem;
    const originalError = console.error;
    console.error = jest.fn();
    localStorage.getItem = jest.fn(() => {
      throw new Error('storage broken');
    }) as typeof localStorage.getItem;
    expect(StorageManager.load()).toBeNull();
    localStorage.getItem = originalGetItem;
    console.error = originalError;
  });

  test('clear swallows removeItem errors', () => {
    const originalRemoveItem = localStorage.removeItem;
    const originalError = console.error;
    console.error = jest.fn();
    localStorage.removeItem = jest.fn(() => {
      throw new Error('cannot remove');
    }) as typeof localStorage.removeItem;
    expect(() => StorageManager.clear()).not.toThrow();
    localStorage.removeItem = originalRemoveItem;
    console.error = originalError;
  });

  test('detects unversioned v3 payload by shape', () => {
    const v3NoVersion = {
      current: {
        activities: [{ id: '1', name: 'X', weight: 4, polarity: 'positive' }],
      },
      desired: { activities: [{ id: '2', name: 'Y', weight: 6, polarity: 'negative' }] },
    };
    const result = importData(JSON.stringify(v3NoVersion));
    expect(result.version).toBe('3.0');
    expect(result.current.activities[0].weight).toBe(4);
  });

  test('load migrates v1 from localStorage and writes back v3', () => {
    const v1 = {
      version: '1.0',
      positive: { activities: [{ id: '1', name: 'Sport', value: 3 }] },
      negative: { activities: [{ id: '2', name: 'Stress', value: 2 }] },
    };
    localStorage.setItem('energiekuchen-data', JSON.stringify(v1));

    const first = StorageManager.load();
    expect(first?.version).toBe('3.0');
    const stored = JSON.parse(localStorage.getItem('energiekuchen-data') as string);
    expect(stored.version).toBe('3.0');

    const saveSpy = jest.spyOn(StorageManager, 'save');
    StorageManager.load();
    expect(saveSpy).not.toHaveBeenCalled();
    saveSpy.mockRestore();
  });

  test('toV3Serializable rounds weight to 2 decimals', () => {
    const result = toV3Serializable({
      version: '3.0',
      current: { activities: [{ id: '1', name: 'A', weight: 4.567, polarity: 'positive' }] },
      desired: { activities: [] },
    });
    expect(result.current.activities[0].weight).toBe(4.57);
  });

  test('toV3Serializable elides default labelOffset', () => {
    const result = toV3Serializable({
      version: '3.0',
      current: { activities: [{ id: '1', name: 'A', weight: 4, polarity: 'positive', labelOffset: { radial: 0, angular: 0 } }] },
      desired: { activities: [] },
    });
    expect(result.current.activities[0].labelOffset).toBeUndefined();
  });

  test('toV3Serializable preserves non-default labelOffset', () => {
    const offset = { radial: 0.3, angular: 1.2 };
    const result = toV3Serializable({
      version: '3.0',
      current: { activities: [{ id: '1', name: 'A', weight: 4, polarity: 'positive', labelOffset: offset }] },
      desired: { activities: [] },
    });
    expect(result.current.activities[0].labelOffset).toEqual(offset);
  });

  test('toV3Serializable elides absent details', () => {
    const result = toV3Serializable({
      version: '3.0',
      current: { activities: [{ id: '1', name: 'A', weight: 4, polarity: 'positive' }] },
      desired: { activities: [] },
    });
    expect(result.current.activities[0].details).toBeUndefined();
  });

  test('v2 payload with empty id assigns a UUID', () => {
    const v2 = {
      version: '2.0',
      current: { activities: [{ id: '', name: 'NoId', value: 2 }] },
      desired: { activities: [] },
    };
    const result = StorageManager.import(JSON.stringify(v2));
    expect(result.current.activities[0].id).toMatch(/[0-9a-f-]{36}/);
  });
});
