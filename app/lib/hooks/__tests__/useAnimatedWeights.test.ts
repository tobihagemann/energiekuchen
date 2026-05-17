import { act, renderHook } from '@testing-library/react';

import { useAnimatedLabelOffsets, useAnimatedWeights } from '../useAnimatedWeights';

class FakeRAF {
  private callbacks = new Map<number, FrameRequestCallback>();
  private nextId = 1;
  now = 0;

  request = (cb: FrameRequestCallback): number => {
    const id = this.nextId++;
    this.callbacks.set(id, cb);
    return id;
  };

  cancel = (id: number): void => {
    this.callbacks.delete(id);
  };

  tick(deltaMs: number): void {
    this.now += deltaMs;
    const pending = Array.from(this.callbacks.entries());
    this.callbacks.clear();
    for (const [, cb] of pending) {
      cb(this.now);
    }
  }

  reset(): void {
    this.callbacks.clear();
    this.nextId = 1;
    this.now = 0;
  }

  pending(): number {
    return this.callbacks.size;
  }
}

const raf = new FakeRAF();

beforeEach(() => {
  raf.reset();
  global.requestAnimationFrame = raf.request as typeof requestAnimationFrame;
  global.cancelAnimationFrame = raf.cancel as typeof cancelAnimationFrame;
  jest.spyOn(performance, 'now').mockImplementation(() => raf.now);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('useAnimatedWeights', () => {
  test('bypass returns the target immediately', () => {
    const { result, rerender } = renderHook(({ target }: { target: number[] }) => useAnimatedWeights(target, { bypass: true }), {
      initialProps: { target: [4, 6] },
    });
    expect(result.current).toEqual([4, 6]);
    rerender({ target: [5, 5] });
    expect(result.current).toEqual([5, 5]);
  });

  test('non-bypass interpolates over the duration', () => {
    const { result, rerender } = renderHook(({ target }: { target: number[] }) => useAnimatedWeights(target, { bypass: false, durationMs: 150 }), {
      initialProps: { target: [0, 10] },
    });
    rerender({ target: [10, 0] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0]).toBeGreaterThan(0);
    expect(result.current[0]).toBeLessThan(10);
    act(() => {
      raf.tick(75);
    });
    expect(result.current).toEqual([10, 0]);
  });

  test('length change snaps synchronously without crashing', () => {
    const { result, rerender } = renderHook(({ target }: { target: number[] }) => useAnimatedWeights(target, { bypass: false, durationMs: 150 }), {
      initialProps: { target: [1, 2, 3] },
    });
    rerender({ target: [5, 5] });
    expect(result.current).toEqual([5, 5]);
  });

  test('unmount cancels the pending rAF', () => {
    const { rerender, unmount } = renderHook(({ target }: { target: number[] }) => useAnimatedWeights(target, { bypass: false, durationMs: 150 }), {
      initialProps: { target: [0, 10] },
    });
    rerender({ target: [10, 0] });
    expect(raf.pending()).toBeGreaterThan(0);
    unmount();
    expect(raf.pending()).toBe(0);
  });

  test('mid-flight retarget recomputes from the current interpolated value', () => {
    const { result, rerender } = renderHook(({ target }: { target: number[] }) => useAnimatedWeights(target, { bypass: false, durationMs: 150 }), {
      initialProps: { target: [0, 10] },
    });
    rerender({ target: [10, 0] });
    act(() => {
      raf.tick(75);
    });
    const midpoint = result.current[0];
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(10);
    rerender({ target: [5, 5] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current).toEqual([5, 5]);
  });
});

describe('useAnimatedLabelOffsets', () => {
  test('bypass returns target immediately', () => {
    const target = [{ radial: 0.2, angular: 0.3 }, undefined];
    const { result } = renderHook(() => useAnimatedLabelOffsets(target, { bypass: true }));
    expect(result.current).toEqual(target);
  });

  test('interpolates from undefined to defined as a transition through zero offset', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: Array<{ radial: number; angular: number } | undefined> }) => useAnimatedLabelOffsets(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [undefined] as Array<{ radial: number; angular: number } | undefined> },
      }
    );
    rerender({ target: [{ radial: 0.4, angular: 0 }] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0]?.radial).toBeGreaterThan(0);
    expect(result.current[0]?.radial).toBeLessThan(0.4);
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0]?.radial).toBeCloseTo(0.4);
  });

  test('clear to undefined resolves to undefined at t=1', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: Array<{ radial: number; angular: number } | undefined> }) => useAnimatedLabelOffsets(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [{ radial: 0.3, angular: 0 }] as Array<{ radial: number; angular: number } | undefined> },
      }
    );
    rerender({ target: [undefined] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current[0]).toBeUndefined();
  });
});
