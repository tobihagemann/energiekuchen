import {
  applyLabelOffset,
  AUTO_NUDGE_MAX_PASSES,
  autoNudgeLabels,
  computeDefaultLabelPosition,
  isInSnapZone,
  LABEL_DEFAULT_RADIUS_FRACTION,
  LEADER_LINE_THRESHOLD_FRACTION,
  shouldShowLeaderLine,
  SNAP_ZONE_FRACTION,
} from '../labelLayout';

describe('computeDefaultLabelPosition', () => {
  test('places label at fraction 0.6 of radius along midAngle', () => {
    const pos = computeDefaultLabelPosition({ cx: 0, cy: 0, radius: 100, midAngle: 0 });
    expect(pos.x).toBeCloseTo(60);
    expect(pos.y).toBeCloseTo(0);
  });

  test('LABEL_DEFAULT_RADIUS_FRACTION is 0.6', () => {
    expect(LABEL_DEFAULT_RADIUS_FRACTION).toBe(0.6);
  });
});

describe('applyLabelOffset', () => {
  test('returns the default position when offset is undefined', () => {
    const pos = applyLabelOffset({ cx: 0, cy: 0, midAngle: 0 }, undefined, 100);
    expect(pos.x).toBeCloseTo(60);
    expect(pos.y).toBeCloseTo(0);
  });

  test('moves radially outward when radial > 0', () => {
    const pos = applyLabelOffset({ cx: 0, cy: 0, midAngle: 0 }, { radial: 0.2, angular: 0 }, 100);
    expect(pos.x).toBeCloseTo(80);
    expect(pos.y).toBeCloseTo(0);
  });

  test('rotates clockwise when angular > 0', () => {
    const pos = applyLabelOffset({ cx: 0, cy: 0, midAngle: 0 }, { radial: 0, angular: Math.PI / 2 }, 100);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(60);
  });
});

describe('shouldShowLeaderLine', () => {
  test('returns true when distance ≥ 15% of radius', () => {
    const ok = shouldShowLeaderLine({ x: 16, y: 0 }, { x: 0, y: 0 }, 100);
    expect(ok).toBe(true);
  });

  test('returns false when below the threshold', () => {
    const ok = shouldShowLeaderLine({ x: 14, y: 0 }, { x: 0, y: 0 }, 100);
    expect(ok).toBe(false);
  });

  test('LEADER_LINE_THRESHOLD_FRACTION is 0.15', () => {
    expect(LEADER_LINE_THRESHOLD_FRACTION).toBe(0.15);
  });
});

describe('isInSnapZone', () => {
  test('returns true within 10% of radius', () => {
    expect(isInSnapZone({ x: 9, y: 0 }, { x: 0, y: 0 }, 100)).toBe(true);
  });

  test('returns false beyond 10% of radius', () => {
    expect(isInSnapZone({ x: 11, y: 0 }, { x: 0, y: 0 }, 100)).toBe(false);
  });

  test('SNAP_ZONE_FRACTION is 0.10', () => {
    expect(SNAP_ZONE_FRACTION).toBe(0.1);
  });
});

describe('autoNudgeLabels', () => {
  test('does not mutate non-overlapping labels', () => {
    const result = autoNudgeLabels(
      [
        { id: 'a', x: 0, y: 0, bbox: { w: 10, h: 10 }, midAngle: 0 },
        { id: 'b', x: 100, y: 100, bbox: { w: 10, h: 10 }, midAngle: Math.PI / 2 },
      ],
      100
    );
    expect(result[0]).toEqual({ id: 'a', x: 0, y: 0 });
    expect(result[1]).toEqual({ id: 'b', x: 100, y: 100 });
  });

  test('separates overlapping labels after at most AUTO_NUDGE_MAX_PASSES passes', () => {
    const result = autoNudgeLabels(
      [
        { id: 'a', x: 0, y: 0, bbox: { w: 20, h: 10 }, midAngle: 0 },
        { id: 'b', x: 5, y: 5, bbox: { w: 20, h: 10 }, midAngle: Math.PI / 4 },
      ],
      100
    );
    const dx = Math.abs(result[0].x - result[1].x);
    const dy = Math.abs(result[0].y - result[1].y);
    expect(dx >= 20 || dy >= 10).toBe(true);
  });

  test('dragged label is exempt from nudge', () => {
    const result = autoNudgeLabels(
      [
        { id: 'a', x: 0, y: 0, bbox: { w: 30, h: 30 }, midAngle: 0, draggedId: 'a' },
        { id: 'b', x: 1, y: 1, bbox: { w: 30, h: 30 }, midAngle: Math.PI / 2, draggedId: 'a' },
      ],
      100
    );
    expect(result[0]).toEqual({ id: 'a', x: 0, y: 0 });
    expect(result[1].x === 1 && result[1].y === 1).toBe(false);
  });

  test('residual overlap is accepted after the iteration cap', () => {
    const result = autoNudgeLabels(
      [
        { id: 'a', x: 0, y: 0, bbox: { w: 50, h: 50 }, midAngle: 0 },
        { id: 'b', x: 1, y: 0, bbox: { w: 50, h: 50 }, midAngle: 0 },
        { id: 'c', x: 0, y: 1, bbox: { w: 50, h: 50 }, midAngle: 0 },
      ],
      100
    );
    expect(result).toHaveLength(3);
  });

  test('AUTO_NUDGE_MAX_PASSES is 4', () => {
    expect(AUTO_NUDGE_MAX_PASSES).toBe(4);
  });
});
