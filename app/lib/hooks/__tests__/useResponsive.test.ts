import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { act, renderHook } from '@testing-library/react';

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1280,
});

// Mock window.addEventListener and removeEventListener
const mockAddEventListener = jest.fn();
const mockRemoveEventListener = jest.fn();

Object.defineProperty(window, 'addEventListener', {
  writable: true,
  configurable: true,
  value: mockAddEventListener,
});

Object.defineProperty(window, 'removeEventListener', {
  writable: true,
  configurable: true,
  value: mockRemoveEventListener,
});

describe('useResponsive', () => {
  beforeEach(() => {
    // Reset to default large size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1280,
    });
  });

  describe('initial screen size detection', () => {
    it('detects small screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 639, // Just below 640px threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(false);
    });

    it('detects medium screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640, // Exactly at medium threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(true);
      expect(result.current.isLarge).toBe(false);
    });

    it('detects medium upper range correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1279, // Just below large threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(true);
      expect(result.current.isLarge).toBe(false);
    });

    it('detects large screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280, // Exactly at large threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });

    it('detects very large screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Large desktop
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });
  });

  describe('boundary values', () => {
    it('handles exact small-medium boundary', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 640,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(true);
      expect(result.current.isLarge).toBe(false);
    });

    it('handles exact medium-large boundary', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });

    it('handles very small screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320, // Very small mobile
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(false);
    });

    it('handles very large screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 4096, // Very large desktop/4K
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });
  });

  describe('event listener management', () => {
    it('adds resize event listener on mount', () => {
      renderHook(() => useResponsive());

      expect(mockAddEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('removes resize event listener on unmount', () => {
      const { unmount } = renderHook(() => useResponsive());

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('uses the same function reference for add and remove', () => {
      const { unmount } = renderHook(() => useResponsive());

      const addEventListenerCall = mockAddEventListener.mock.calls[0];
      const addedFunction = addEventListenerCall[1];

      unmount();

      const removeEventListenerCall = mockRemoveEventListener.mock.calls[0];
      const removedFunction = removeEventListenerCall[1];

      expect(addedFunction).toBe(removedFunction);
    });
  });

  describe('resize event handling', () => {
    it('updates state when resizing from large to small', () => {
      // Start with large
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1280,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isLarge).toBe(true);

      // Simulate resize to small
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 500,
        });

        // Get the resize handler that was added
        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isSmall).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(false);
    });

    it('updates state when resizing from small to medium', () => {
      // Start with small
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(true);

      // Simulate resize to medium
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });

        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(true);
      expect(result.current.isLarge).toBe(false);
    });

    it('updates state when resizing from medium to large', () => {
      // Start with medium
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMedium).toBe(true);

      // Simulate resize to large
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1400,
        });

        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });

    it('handles multiple rapid resize events', () => {
      const { result } = renderHook(() => useResponsive());

      const resizeHandler = mockAddEventListener.mock.calls[0][1];

      // Rapid changes
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 500 });
        resizeHandler();
      });
      expect(result.current.isSmall).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 800 });
        resizeHandler();
      });
      expect(result.current.isMedium).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1400 });
        resizeHandler();
      });
      expect(result.current.isLarge).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 400 });
        resizeHandler();
      });
      expect(result.current.isSmall).toBe(true);
    });
  });

  describe('initial state', () => {
    it('has consistent initial state based on window width', () => {
      const testCases = [
        { width: 500, expected: { isSmall: true, isMedium: false, isLarge: false } },
        { width: 640, expected: { isSmall: false, isMedium: true, isLarge: false } },
        { width: 1280, expected: { isSmall: false, isMedium: false, isLarge: true } },
      ];

      testCases.forEach(({ width, expected }) => {
        Object.defineProperty(window, 'innerWidth', { value: width });

        const { result } = renderHook(() => useResponsive());

        expect(result.current).toEqual(expected);
      });
    });
  });

  describe('state consistency', () => {
    it('ensures only one breakpoint is active at a time', () => {
      const testWidths = [320, 500, 639, 640, 900, 1279, 1280, 1400, 1920];

      testWidths.forEach(width => {
        Object.defineProperty(window, 'innerWidth', { value: width });

        const { result } = renderHook(() => useResponsive());

        const activeStates = [result.current.isSmall, result.current.isMedium, result.current.isLarge].filter(Boolean);

        expect(activeStates).toHaveLength(1);
      });
    });
  });

  describe('edge cases', () => {
    it('handles zero width', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 0,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(false);
    });

    it('handles negative width (theoretical edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: -100,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(true);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(false);
    });

    it('handles very large width values', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: Number.MAX_SAFE_INTEGER,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isSmall).toBe(false);
      expect(result.current.isMedium).toBe(false);
      expect(result.current.isLarge).toBe(true);
    });
  });
});
