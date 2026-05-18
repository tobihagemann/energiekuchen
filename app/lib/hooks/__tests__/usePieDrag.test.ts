import { act, renderHook } from '@testing-library/react';
import React from 'react';

import type { WeightEntry } from '@/app/lib/utils/redistribution';

import { usePieDrag } from '../usePieDrag';

function makeSvg(scale = 1): SVGSVGElement {
  return {
    getScreenCTM: () => ({
      a: scale,
      b: 0,
      c: 0,
      d: scale,
      e: 0,
      f: 0,
      inverse: () => ({ a: 1 / scale, b: 0, c: 0, d: 1 / scale, e: 0, f: 0 }),
    }),
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 200 * scale, height: 200 * scale }),
    viewBox: { baseVal: { x: 0, y: 0, width: 200, height: 200 } },
  } as unknown as SVGSVGElement;
}

function makePointerEvent(type: string, init: { clientX: number; clientY: number; pointerId: number }): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, init);
  return event;
}

function pointerEvent(clientX: number, clientY: number, target: EventTarget): React.PointerEvent {
  return {
    clientX,
    clientY,
    pointerId: 1,
    stopPropagation: () => {},
    target,
    currentTarget: target,
  } as unknown as React.PointerEvent;
}

function setupHook(overrides: Partial<Parameters<typeof usePieDrag>[0]> = {}) {
  const svg = makeSvg(overrides.svgRef ? 1 : 1);
  const svgRef = { current: svg } as React.RefObject<SVGSVGElement | null>;
  const setActivityWeights = jest.fn();
  const setLabelOffset = jest.fn();
  const renderedEntries: WeightEntry[] = [
    { id: 'a', weight: 5 },
    { id: 'b', weight: 5 },
  ];
  const hook = renderHook(() =>
    usePieDrag({
      svgRef,
      center: { cx: 100, cy: 100 },
      total: 10,
      chartType: 'current',
      renderedEntries,
      setActivityWeights,
      setLabelOffset,
      ...overrides,
    })
  );
  return { hook, svg, setActivityWeights, setLabelOffset, svgRef };
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('usePieDrag boundary', () => {
  test('floor clamp halts further movement', () => {
    const { hook } = setupHook();
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onBoundaryPointerDown({ receiverId: 'a', donorId: 'b', receiverIndex: 0, donorIndex: 1 }, pointerEvent(200, 100, target));
    });

    act(() => {
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 100, clientY: 0, pointerId: 1 }));
    });
    const after = hook.result.current.liveBoundaryWeights;
    expect(after).not.toBeNull();
    if (after) {
      expect(after.b).toBeGreaterThanOrEqual(0.1);
      expect(after.a + after.b).toBeCloseTo(10, 2);
    }

    // Push hard against the floor — extra movement past the wall must not push donor below floor.
    act(() => {
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 100, clientY: -1000, pointerId: 1 }));
    });
    const at = hook.result.current.liveBoundaryWeights;
    if (at) {
      expect(at.b).toBeGreaterThanOrEqual(0.1);
    }

    act(() => {
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 100, clientY: -1000, pointerId: 1 }));
    });
  });

  test('wrapping past the start antipode keeps the receiver capped, not flipped', () => {
    const { hook } = setupHook();
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onBoundaryPointerDown({ receiverId: 'a', donorId: 'b', receiverIndex: 0, donorIndex: 1 }, pointerEvent(200, 100, target));
    });

    // Sweep clockwise around the chart past the start antipode (π wrap point).
    // A single-shot diff against the start angle would normalize to a large negative
    // delta and swap the roles; cumulative integration keeps the donor at floor.
    const path = [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI - 0.01, Math.PI + 0.01, (5 * Math.PI) / 4];
    for (const ang of path) {
      act(() => {
        document.dispatchEvent(
          makePointerEvent('pointermove', {
            clientX: 100 + 100 * Math.cos(ang),
            clientY: 100 + 100 * Math.sin(ang),
            pointerId: 1,
          })
        );
      });
    }
    const live = hook.result.current.liveBoundaryWeights;
    expect(live).not.toBeNull();
    if (live) {
      // Receiver grew (cap held), donor shrank toward floor — not the inverse.
      expect(live.a).toBeCloseTo(9.9, 5);
      expect(live.b).toBeCloseTo(0.1, 5);
    }

    act(() => {
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 0, clientY: 100, pointerId: 1 }));
    });
  });

  test('readOnly short-circuits pointerdown to a no-op', () => {
    const { hook } = setupHook({ readOnly: true });
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onBoundaryPointerDown({ receiverId: 'a', donorId: 'b', receiverIndex: 0, donorIndex: 1 }, pointerEvent(120, 100, target));
    });
    expect(hook.result.current.draggingBoundary).toBeNull();
    expect(hook.result.current.liveBoundaryWeights).toBeNull();
  });

  test('commit dispatches setActivityWeights with the two affected entries', () => {
    const { hook, setActivityWeights } = setupHook();
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onBoundaryPointerDown({ receiverId: 'a', donorId: 'b', receiverIndex: 0, donorIndex: 1 }, pointerEvent(200, 100, target));
    });
    act(() => {
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 150, clientY: 50, pointerId: 1 }));
    });
    act(() => {
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 150, clientY: 50, pointerId: 1 }));
    });

    expect(setActivityWeights).toHaveBeenCalledTimes(1);
    const [chartType, entries] = setActivityWeights.mock.calls[0];
    expect(chartType).toBe('current');
    expect(entries).toHaveLength(2);
    const ids = entries.map((e: WeightEntry) => e.id).sort();
    expect(ids).toEqual(['a', 'b']);
  });
});

describe('usePieDrag label', () => {
  test('snap zone release dispatches null', () => {
    const { hook, setLabelOffset } = setupHook();
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onLabelPointerDown({ activityId: 'a', midAngle: 0, radius: 100 }, pointerEvent(160, 100, target));
    });
    // Release back close to the default centroid position.
    act(() => {
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 161, clientY: 100, pointerId: 1 }));
    });
    act(() => {
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 161, clientY: 100, pointerId: 1 }));
    });
    expect(setLabelOffset).toHaveBeenCalledWith('current', 'a', null);
  });

  test('outside-snap-zone release dispatches the validated offset', () => {
    const { hook, setLabelOffset } = setupHook();
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      hook.result.current.onLabelPointerDown({ activityId: 'a', midAngle: 0, radius: 100 }, pointerEvent(160, 100, target));
    });
    act(() => {
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 195, clientY: 100, pointerId: 1 }));
    });
    act(() => {
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 195, clientY: 100, pointerId: 1 }));
    });

    expect(setLabelOffset).toHaveBeenCalled();
    const lastCall = setLabelOffset.mock.calls[setLabelOffset.mock.calls.length - 1];
    expect(lastCall[2]).not.toBeNull();
    expect((lastCall[2] as { radial: number }).radial).toBeGreaterThan(0.1);
  });

  test('scaled-SVG case produces the same persisted offset for the same visual drag', () => {
    const setLabelOffsetFull = jest.fn();
    const setLabelOffsetHalf = jest.fn();
    const full = renderHook(() =>
      usePieDrag({
        svgRef: { current: makeSvg(1) } as React.RefObject<SVGSVGElement | null>,
        center: { cx: 100, cy: 100 },
        total: 10,
        chartType: 'current',
        renderedEntries: [{ id: 'a', weight: 10 }],
        setActivityWeights: jest.fn(),
        setLabelOffset: setLabelOffsetFull,
      })
    );
    const half = renderHook(() =>
      usePieDrag({
        svgRef: { current: makeSvg(0.5) } as React.RefObject<SVGSVGElement | null>,
        center: { cx: 100, cy: 100 },
        total: 10,
        chartType: 'current',
        renderedEntries: [{ id: 'a', weight: 10 }],
        setActivityWeights: jest.fn(),
        setLabelOffset: setLabelOffsetHalf,
      })
    );
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);

    act(() => {
      full.result.current.onLabelPointerDown({ activityId: 'a', midAngle: 0, radius: 100 }, pointerEvent(160, 100, target));
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 195, clientY: 100, pointerId: 1 }));
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 195, clientY: 100, pointerId: 1 }));
    });
    act(() => {
      half.result.current.onLabelPointerDown({ activityId: 'a', midAngle: 0, radius: 100 }, pointerEvent(80, 50, target));
      document.dispatchEvent(makePointerEvent('pointermove', { clientX: 97.5, clientY: 50, pointerId: 1 }));
      document.dispatchEvent(makePointerEvent('pointerup', { clientX: 97.5, clientY: 50, pointerId: 1 }));
    });
    const fullOffset = setLabelOffsetFull.mock.calls.at(-1)?.[2];
    const halfOffset = setLabelOffsetHalf.mock.calls.at(-1)?.[2];
    expect(fullOffset).toBeTruthy();
    expect(halfOffset).toBeTruthy();
    expect(halfOffset.radial).toBeCloseTo(fullOffset.radial, 3);
    expect(halfOffset.angular).toBeCloseTo(fullOffset.angular, 3);
  });

  test('readOnly short-circuits label pointerdown', () => {
    const { hook, setLabelOffset } = setupHook({ readOnly: true });
    const target = document.createElement('div');
    target.setPointerCapture = () => {};
    document.body.appendChild(target);
    act(() => {
      hook.result.current.onLabelPointerDown({ activityId: 'a', midAngle: 0, radius: 100 }, pointerEvent(160, 100, target));
    });
    expect(hook.result.current.draggingLabel).toBeNull();
    expect(setLabelOffset).not.toHaveBeenCalled();
  });
});
