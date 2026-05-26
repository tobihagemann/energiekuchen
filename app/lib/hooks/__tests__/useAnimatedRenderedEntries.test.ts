import { act, renderHook } from '@testing-library/react';

import { normalizeAngle } from '../../utils/polar';
import { computeStartAngles } from '../../utils/sliceAngles';
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
    // An add is a membership change, not a reorder: the angle channel stays inert.
    expect(result.current.every(e => e.startAngle === undefined)).toBe(true);
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
    // A delete is a membership change, not a reorder: the angle channel stays inert.
    expect(result.current.every(e => e.startAngle === undefined)).toBe(true);
    act(() => {
      raf.tick(75);
    });
    expect(result.current.find(e => e.id === 'b')).toBeUndefined();
    expect(result.current).toHaveLength(1);
  });

  test('deleting the first entry keeps its ghost at the head of the order', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 3), entry('b', 3), entry('c', 3)] },
      }
    );
    rerender({ target: [entry('b', 3), entry('c', 3)] });
    act(() => {
      raf.tick(75);
    });
    // 'a' had no preceding target id, so it lands in the head-ghost slot at the front.
    expect(result.current.map(e => e.id)).toEqual(['a', 'b', 'c']);
    expect(result.current[0].isGhost).toBe(true);
    expect(typeof result.current[0].shadeDepth).toBe('number');
  });

  test('deleting the last entry drops straight to empty without a lingering ghost', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5)] },
      }
    );
    // A lone ghost would keep a full-circle sweep (weight/total stays 1) and pop at t=1, so
    // emptying the chart yields no entries at all rather than a held full-circle ghost. The
    // transition is immediate: no held frame and no animation loop left spinning.
    rerender({ target: [] });
    expect(result.current).toEqual([]);
    expect(raf.pending()).toBe(0);
  });

  test('emptying mid-animation cancels the pending frame and still recovers when re-populated', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      {
        initialProps: { target: [entry('a', 5), entry('b', 5)] },
      }
    );
    rerender({ target: [entry('a', 9), entry('b', 1)] });
    act(() => {
      raf.tick(50);
    });
    expect(raf.pending()).toBeGreaterThan(0);
    // Empty the chart mid-animation: the pending frame is cancelled and state clears at once.
    rerender({ target: [] });
    expect(result.current).toEqual([]);
    expect(raf.pending()).toBe(0);
    // Re-populating after empty must retarget cleanly (toRef was reset, so the new entry grows in).
    rerender({ target: [entry('c', 4)] });
    act(() => {
      raf.tick(150);
    });
    expect(result.current.map(e => e.id)).toEqual(['c']);
    expect(result.current[0].weight).toBeCloseTo(4);
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

  test('offset cleared to "no offset" resolves to the materialized {0,0} at t=1', () => {
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
    expect(result.current[0].labelOffset).toEqual({ radial: 0, angular: 0 });
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

  test('every output entry carries a numeric shadeDepth (initial, animated, bypass reset)', () => {
    const { result, rerender } = renderHook(
      ({ target, bypass }: { target: RenderedEntry[]; bypass: boolean }) => useAnimatedRenderedEntries(target, { bypass, durationMs: 150 }),
      { initialProps: { target: [entry('a', 5), entry('b', 3)], bypass: false } }
    );
    expect(result.current.every(e => typeof e.shadeDepth === 'number')).toBe(true);
    rerender({ target: [entry('a', 3), entry('b', 5)], bypass: false });
    act(() => {
      raf.tick(75);
    });
    expect(result.current.every(e => typeof e.shadeDepth === 'number')).toBe(true);
    rerender({ target: [entry('a', 6), entry('b', 2)], bypass: true });
    expect(result.current.every(e => typeof e.shadeDepth === 'number')).toBe(true);
  });

  test('a shrinking ghost keeps a numeric shadeDepth', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 5), entry('b', 5)] } }
    );
    rerender({ target: [entry('a', 5)] });
    act(() => {
      raf.tick(75);
    });
    const ghost = result.current.find(e => e.id === 'b')!;
    expect(ghost.isGhost).toBe(true);
    expect(typeof ghost.shadeDepth).toBe('number');
  });

  test('shadeDepth eases across a rank crossover', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 8), entry('b', 2)] } }
    );
    act(() => {
      raf.tick(150);
    });
    // A 2-slice group fans to depths 2/3 (darkest) and 1/3 (palest), not the full 1/0 extremes.
    expect(result.current.find(e => e.id === 'a')!.shadeDepth).toBeCloseTo(2 / 3);
    expect(result.current.find(e => e.id === 'b')!.shadeDepth).toBeCloseTo(1 / 3);
    // Swap weights so the ranks (and thus target depths) cross.
    rerender({ target: [entry('a', 2), entry('b', 8)] });
    act(() => {
      raf.tick(75);
    });
    const aMid = result.current.find(e => e.id === 'a')!.shadeDepth;
    expect(aMid).toBeGreaterThan(1 / 3);
    expect(aMid).toBeLessThan(2 / 3);
    act(() => {
      raf.tick(75);
    });
    expect(result.current.find(e => e.id === 'a')!.shadeDepth).toBeCloseTo(1 / 3);
    expect(result.current.find(e => e.id === 'b')!.shadeDepth).toBeCloseTo(2 / 3);
  });

  test('reorder eases startAngle on every entry; a weight-only change leaves it inert', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 4), entry('b', 3), entry('c', 3)] } }
    );
    act(() => {
      raf.tick(150);
    });
    // Weight-only change: the angle channel stays inert on every entry.
    rerender({ target: [entry('a', 5), entry('b', 3), entry('c', 2)] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current.every(e => e.startAngle === undefined)).toBe(true);
    act(() => {
      raf.tick(75);
    });
    // Reorder (same membership, different order): every entry gets an animated start angle.
    rerender({ target: [entry('c', 2), entry('b', 3), entry('a', 5)] });
    act(() => {
      raf.tick(75);
    });
    expect(result.current.every(e => typeof e.startAngle === 'number')).toBe(true);
  });

  test('a moved slice eases its start angle shortest-arc between its old and new ring slots', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 4), entry('b', 3), entry('c', 3)] } }
    );
    act(() => {
      raf.tick(150);
    });
    // Swap a↔c order, weights unchanged. At t=0.5 (eased 0.5) a's start sits halfway along
    // the short arc from its old slot (front of [a,b,c]) to its new slot (back of [c,b,a]).
    rerender({ target: [entry('c', 3), entry('b', 3), entry('a', 4)] });
    act(() => {
      raf.tick(75);
    });
    const fromA = computeStartAngles([4, 3, 3])[0];
    const toA = computeStartAngles([3, 3, 4])[2];
    const expectedA = fromA + normalizeAngle(toA - fromA) * 0.5;
    expect(result.current.find(e => e.id === 'a')!.startAngle).toBeCloseTo(expectedA, 5);
  });

  test('a reorder interrupting an in-flight reorder eases from the on-screen start angle', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 4), entry('b', 3), entry('c', 3)] } }
    );
    // First reorder, left mid-flight at t=0.5.
    rerender({ target: [entry('c', 3), entry('b', 3), entry('a', 4)] });
    act(() => {
      raf.tick(75);
    });
    const midA = result.current.find(e => e.id === 'a')!.startAngle!;
    expect(typeof midA).toBe('number');
    // Second reorder interrupts; at its first frame (eased 0) 'a' must resume from where it
    // is on screen (midA), not snap to the fresh contiguous walk.
    rerender({ target: [entry('a', 4), entry('b', 3), entry('c', 3)] });
    act(() => {
      raf.tick(0);
    });
    expect(result.current.find(e => e.id === 'a')!.startAngle).toBeCloseTo(midA, 5);
  });

  test('a reorder while a deletion ghost is shrinking walks start angles ghost-inclusive', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 4), entry('b', 3), entry('c', 3)] } }
    );
    act(() => {
      raf.tick(150);
    });
    // Delete c → it becomes a shrinking ghost (membership change, angle channel still inert).
    rerender({ target: [entry('a', 4), entry('b', 3)] });
    act(() => {
      raf.tick(50);
    });
    expect(result.current.find(e => e.id === 'c')?.isGhost).toBe(true);
    // Reorder the survivors before the ghost settles. The start-angle walk runs over the
    // ghost-inclusive target set, so the ghost gets a start angle too and the all-or-nothing
    // invariant holds — a ghost-exclusive walk would leave the ghost's startAngle undefined.
    rerender({ target: [entry('b', 3), entry('a', 4)] });
    act(() => {
      raf.tick(0);
    });
    const ghost = result.current.find(e => e.id === 'c')!;
    expect(ghost.isGhost).toBe(true);
    expect(typeof ghost.startAngle).toBe('number');
    expect(result.current.every(e => typeof e.startAngle === 'number')).toBe(true);
  });

  test('a membership change mid-reorder snaps the angle channel off (no mixed frame)', () => {
    const { result, rerender } = renderHook(
      ({ target }: { target: RenderedEntry[] }) => useAnimatedRenderedEntries(target, { bypass: false, durationMs: 150 }),
      { initialProps: { target: [entry('a', 4), entry('b', 3), entry('c', 3)] } }
    );
    act(() => {
      raf.tick(150);
    });
    // Start a reorder so the angle channel is active...
    rerender({ target: [entry('c', 3), entry('b', 3), entry('a', 4)] });
    act(() => {
      raf.tick(50);
    });
    expect(result.current.every(e => typeof e.startAngle === 'number')).toBe(true);
    // ...then a delete arrives: membership changed, so it is not a reorder and the channel
    // goes fully inert rather than emitting a frame where only some entries carry a start.
    rerender({ target: [entry('b', 3), entry('a', 4)] });
    act(() => {
      raf.tick(50);
    });
    expect(result.current.every(e => e.startAngle === undefined)).toBe(true);
  });
});
