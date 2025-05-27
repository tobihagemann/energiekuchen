import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { act, renderHook } from '@testing-library/react';

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024,
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
    // Reset to default desktop size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  describe('initial screen size detection', () => {
    it('detects mobile screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767, // Just below 768px threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('detects tablet screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768, // Exactly at tablet threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('detects tablet upper range correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1023, // Just below desktop threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('detects desktop screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024, // Exactly at desktop threshold
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('detects large desktop screen size correctly', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920, // Large desktop
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });

  describe('boundary values', () => {
    it('handles exact mobile-tablet boundary', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('handles exact tablet-desktop boundary', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('handles very small screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320, // Very small mobile
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('handles very large screen sizes', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 4096, // Very large desktop/4K
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
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
    it('updates state when resizing from desktop to mobile', () => {
      // Start with desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isDesktop).toBe(true);

      // Simulate resize to mobile
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 600,
        });

        // Get the resize handler that was added
        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('updates state when resizing from mobile to tablet', () => {
      // Start with mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);

      // Simulate resize to tablet
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 800,
        });

        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(true);
      expect(result.current.isDesktop).toBe(false);
    });

    it('updates state when resizing from tablet to desktop', () => {
      // Start with tablet
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 800,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isTablet).toBe(true);

      // Simulate resize to desktop
      act(() => {
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: 1200,
        });

        const resizeHandler = mockAddEventListener.mock.calls[0][1];
        resizeHandler();
      });

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });

    it('handles multiple rapid resize events', () => {
      const { result } = renderHook(() => useResponsive());

      const resizeHandler = mockAddEventListener.mock.calls[0][1];

      // Rapid changes
      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 600 });
        resizeHandler();
      });
      expect(result.current.isMobile).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 800 });
        resizeHandler();
      });
      expect(result.current.isTablet).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 1200 });
        resizeHandler();
      });
      expect(result.current.isDesktop).toBe(true);

      act(() => {
        Object.defineProperty(window, 'innerWidth', { value: 500 });
        resizeHandler();
      });
      expect(result.current.isMobile).toBe(true);
    });
  });

  describe('initial state', () => {
    it('has consistent initial state based on window width', () => {
      const testCases = [
        { width: 600, expected: { isMobile: true, isTablet: false, isDesktop: false } },
        { width: 768, expected: { isMobile: false, isTablet: true, isDesktop: false } },
        { width: 1024, expected: { isMobile: false, isTablet: false, isDesktop: true } },
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
      const testWidths = [320, 500, 767, 768, 900, 1023, 1024, 1200, 1920];

      testWidths.forEach(width => {
        Object.defineProperty(window, 'innerWidth', { value: width });

        const { result } = renderHook(() => useResponsive());

        const activeStates = [result.current.isMobile, result.current.isTablet, result.current.isDesktop].filter(Boolean);

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

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('handles negative width (theoretical edge case)', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: -100,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(true);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(false);
    });

    it('handles very large width values', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: Number.MAX_SAFE_INTEGER,
      });

      const { result } = renderHook(() => useResponsive());

      expect(result.current.isMobile).toBe(false);
      expect(result.current.isTablet).toBe(false);
      expect(result.current.isDesktop).toBe(true);
    });
  });
});
