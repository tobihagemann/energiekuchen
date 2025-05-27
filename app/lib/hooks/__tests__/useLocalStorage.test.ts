import { useLocalStorage } from '@/app/lib/hooks/useLocalStorage';
import { act, renderHook } from '@testing-library/react';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    length: 0,
    key: jest.fn(),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useLocalStorage', () => {
  const testKey = 'test-key';
  const initialValue = 'initial-value';

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should return initial value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    expect(result.current[0]).toBe(initialValue);
  });

  it('should return stored value from localStorage', () => {
    const storedValue = 'stored-value';
    localStorageMock.setItem(testKey, JSON.stringify(storedValue));

    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    expect(result.current[0]).toBe(storedValue);
  });

  it('should update stored value', () => {
    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    const newValue = 'new-value';

    act(() => {
      result.current[1](newValue);
    });

    expect(result.current[0]).toBe(newValue);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(newValue));
  });

  it('should handle function updates', () => {
    const { result } = renderHook(() => useLocalStorage(testKey, 10));

    act(() => {
      result.current[1](prev => prev + 5);
    });

    expect(result.current[0]).toBe(15);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(15));
  });

  it('should handle complex objects', () => {
    const complexObject = { name: 'test', count: 42, items: ['a', 'b'] };
    const { result } = renderHook(() => useLocalStorage(testKey, complexObject));

    const updatedObject = { ...complexObject, count: 50 };

    act(() => {
      result.current[1](updatedObject);
    });

    expect(result.current[0]).toEqual(updatedObject);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(testKey, JSON.stringify(updatedObject));
  });

  it('should persist state across hook re-initialization', () => {
    // Test that data persists when the hook is used again with the same key
    const { result: firstResult } = renderHook(() => useLocalStorage(testKey, initialValue));

    act(() => {
      firstResult.current[1]('persisted-value');
    });

    // Simulate component unmount/remount by creating a new hook instance
    const { result: secondResult } = renderHook(() => useLocalStorage(testKey, initialValue));

    expect(secondResult.current[0]).toBe('persisted-value');
  });

  it('should handle different data types correctly', () => {
    // Test boolean
    const { result: boolResult } = renderHook(() => useLocalStorage('bool-key', false));
    act(() => {
      boolResult.current[1](true);
    });
    expect(boolResult.current[0]).toBe(true);

    // Test number
    const { result: numberResult } = renderHook(() => useLocalStorage('number-key', 0));
    act(() => {
      numberResult.current[1](42);
    });
    expect(numberResult.current[0]).toBe(42);

    // Test array
    const { result: arrayResult } = renderHook(() => useLocalStorage('array-key', []));
    act(() => {
      arrayResult.current[1]([1, 2, 3]);
    });
    expect(arrayResult.current[0]).toEqual([1, 2, 3]);
  });

  it('should handle localStorage getItem errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    expect(result.current[0]).toBe(initialValue);
    expect(consoleSpy).toHaveBeenCalledWith(`Error reading localStorage key "${testKey}":`, expect.any(Error));
  });

  it('should handle localStorage setItem errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    act(() => {
      result.current[1]('new-value');
    });

    // State should still update even if localStorage fails
    expect(result.current[0]).toBe('new-value');
    expect(consoleSpy).toHaveBeenCalledWith(`Error setting localStorage key "${testKey}":`, expect.any(Error));
  });

  it('should handle invalid JSON in localStorage gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    // Mock getItem to return invalid JSON string
    localStorageMock.getItem.mockReturnValueOnce('invalid-json');

    const { result } = renderHook(() => useLocalStorage(testKey, initialValue));

    expect(result.current[0]).toBe(initialValue);
    expect(consoleSpy).toHaveBeenCalledWith(`Error reading localStorage key "${testKey}":`, expect.any(Error));
  });
});
