import { act, renderHook } from '@testing-library/react';

import { useAnimatedRenderedEntries } from '../useAnimatedRenderedEntries';
import type { RenderedEntry } from '../useChartData';

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

function entry(id: string, weight: number, labelOffset?: { radial: number; angular: number }): RenderedEntry {
  return { id, name: id, polarity: 'positive', weight, labelOffset };
}

describe('useAnimatedRenderedEntries', () => {
  test('bypass returns the target immediately as non-ghost entries', () => {
    const { result, rerender } = renderHook(({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: true }), {
      initialProps: { target: [entry('a', 4), entry('b', 6)] },
    });
    expect(result.current.map(e => e.weight)).toEqual([4, 6]);
    expect(result.current.every(e => !e.isGhost)).toBe(true);
    rerender({ target: [entry('a', 5), entry('b', 5)] });
    expect(result.current.map(e => e.weight)).toEqual([5, 5]);
  });

  test('non-bypass interpolates weights over the duration', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 0), entry('b', 10)] },
      }
    );
    rerender({ target: [entry('a', 10), entry('b', 0)] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0].weight).toBeGreaterThan(0);
    expect(result.current[0].weight).toBeLessThan(10);
    act(() => {
      raf.tick(75);
    });
    expect(result.current.map(e => e.weight)).toEqual([10, 0]);
  });

  test('add: new entry grows from weight 0', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5)] },
      }
    );
    rerender({ target: [entry('a', 5), entry('b', 5)] });
    act(() => {
      raf.tick(0);
    });
    // First frame at t≈0: new entry starts near 0.
    const bFirst = result.current.find(e => e.id === 'b')!;
    expect(bFirst.weight).toBeLessThan(1);
    expect(bFirst.isGhost).toBe(false);
    act(() => {
      raf.tick(150);
    });
    expect(result.current.find(e => e.id === 'b')!.weight).toBeCloseTo(5);
  });

  test('remove: deleted entry stays as ghost until weight reaches 0, then is dropped', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5), entry('b', 5)] },
      }
    );
    rerender({ target: [entry('a', 5)] });
    act(() => {
      raf.tick(75);
    });
    const ghost = result.current.find(e => e.id === 'b');
    expect(ghost).toBeDefined();
    expect(ghost!.isGhost).toBe(true);
    expect(ghost!.weight).toBeGreaterThan(0);
    expect(ghost!.weight).toBeLessThan(5);
    act(() => {
      raf.tick(75);
    });
    expect(result.current.find(e => e.id === 'b')).toBeUndefined();
    expect(result.current).toHaveLength(1);
  });

  test('ghost is positioned after its previous predecessor in the target order', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 3), entry('b', 3), entry('c', 3), entry('d', 3)] },
      }
    );
    rerender({ target: [entry('a', 3), entry('c', 3), entry('d', 3)] });
    act(() => {
      raf.tick(75);
    });
    // Order should be [a, ghost(b), c, d] — b's predecessor was a, so it stays right after a.
    expect(result.current.map(e => e.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.current[1].isGhost).toBe(true);
  });

  test('offset interpolates from undefined to defined as transition through zero', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5)] },
      }
    );
    rerender({ target: [entry('a', 5, { radial: 0.4, angular: 0 })] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0].labelOffset?.radial).toBeGreaterThan(0);
    expect(result.current[0].labelOffset?.radial).toBeLessThan(0.4);
    act(() => {
      raf.tick(75);
    });
    expect(result.current[0].labelOffset?.radial).toBeCloseTo(0.4);
  });

  test('offset cleared to undefined resolves to undefined at t=1', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5, { radial: 0.3, angular: 0 })] },
      }
    );
    rerender({ target: [entry('a', 5)] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current[0].labelOffset).toBeUndefined();
  });

  test('unmount cancels the pending rAF', () => {
    const { rerender, unmount } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 0), entry('b', 10)] },
      }
    );
    rerender({ target: [entry('a', 10), entry('b', 0)] });
    expect(raf.pending()).toBeGreaterThan(0);
    unmount();
    expect(raf.pending()).toBe(0);
  });

  test('mid-flight retarget recomputes from the current interpolated value', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 0), entry('b', 10)] },
      }
    );
    rerender({ target: [entry('a', 10), entry('b', 0)] });
    act(() => {
      raf.tick(75);
    });
    const midpoint = result.current[0].weight;
    expect(midpoint).toBeGreaterThan(0);
    expect(midpoint).toBeLessThan(10);
    rerender({ target: [entry('a', 5), entry('b', 5)] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current.map(e => e.weight)).toEqual([5, 5]);
  });

  test('metadata-only update (rename, polarity flip) propagates without weight change', () => {
    const initial: RenderedEntry[] = [
      { id: 'a', name: 'Sport', polarity: 'positive', weight: 5 },
      { id: 'b', name: 'Stress', polarity: 'negative', weight: 5 },
    ];
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: initial } }
    );
    // Initial animation settles immediately (from == to).
    act(() => {
      raf.tick(150);
    });
    // Rename 'a' and flip its polarity; weights stay identical so targetsEqual would
    // otherwise swallow the update.
    rerender({
      target: [
        { id: 'a', name: 'Lesen', polarity: 'negative', weight: 5 },
        { id: 'b', name: 'Stress', polarity: 'negative', weight: 5 },
      ],
    });
    act(() => {
      raf.tick(150);
    });
    expect(result.current[0].name).toBe('Lesen');
    expect(result.current[0].polarity).toBe('negative');
  });

  test('details-only update propagates without weight or name change', () => {
    // Exercises the `details` branch of `targetsEqual` independently of name/polarity, so
    // a regression that drops the details comparison would surface as a stale tooltip.
    const initial: RenderedEntry[] = [{ id: 'a', name: 'Sport', polarity: 'positive', weight: 5, details: undefined }];
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: initial } }
    );
    act(() => {
      raf.tick(150);
    });
    rerender({ target: [{ id: 'a', name: 'Sport', polarity: 'positive', weight: 5, details: 'Drei Mal pro Woche' }] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current[0].details).toBe('Drei Mal pro Woche');
  });

  test('angular offset interpolates across the ±π seam via the short arc', () => {
    // normalizeAngle(to.angular - from.angular) takes the shortest path around the seam.
    // Going from 0.9π to -0.9π should pass through ±π (~3.14), not back through 0.
    const initial: RenderedEntry[] = [{ id: 'a', name: 'A', polarity: 'positive', weight: 5, labelOffset: { radial: 0, angular: 0.9 * Math.PI } }];
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: initial } }
    );
    act(() => {
      raf.tick(150);
    });
    rerender({ target: [{ id: 'a', name: 'A', polarity: 'positive', weight: 5, labelOffset: { radial: 0, angular: -0.9 * Math.PI } }] });
    act(() => {
      raf.tick(75);
    });
    const midAngular = result.current[0].labelOffset!.angular;
    // At the midpoint, the angle should sit near the ±π seam (|angular| > 0.9π), not near
    // zero (which would indicate the wrong-direction long arc).
    expect(Math.abs(midAngular)).toBeGreaterThan(0.9 * Math.PI);
  });
});
