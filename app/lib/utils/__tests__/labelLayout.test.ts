import {
  applyLabelOffset,
  computeDefaultLabelPosition,
  computeLeaderStart,
  constrainLabelPosition,
  isInSnapZone,
  isLabelOutsideCircle,
  LABEL_DEFAULT_RADIUS_FRACTION,
  nudgeOuterLabelsTangentially,
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

describe('isLabelOutsideCircle', () => {
  test('returns true when the label is beyond the radius', () => {
    expect(isLabelOutsideCircle({ x: 101, y: 0 }, { cx: 0, cy: 0 }, 100)).toBe(true);
  });

  test('returns false when the label sits on or inside the radius', () => {
    expect(isLabelOutsideCircle({ x: 100, y: 0 }, { cx: 0, cy: 0 }, 100)).toBe(false);
    expect(isLabelOutsideCircle({ x: 50, y: 0 }, { cx: 0, cy: 0 }, 100)).toBe(false);
  });
});

describe('constrainLabelPosition', () => {
  const center = { cx: 0, cy: 0 };
  const radius = 100;
  const viewBoxHalf = 200;
  const bbox = { w: 20, h: 10 }; // halfDiag ≈ 11.18

  // Angle-aware bounds: solve "all 4 corners inside circle" / "nearest corner outside circle"
  // for a label centered at distance d on direction (cos θ, sin θ). With K = w·|cos θ| + h·|sin θ|
  // and halfDiagSq = (w²+h²)/4, the quadratic d² ± d·K + halfDiagSq = R² gives both bounds.
  function maxInnerD(angle: number, w: number, h: number, R: number): number {
    const K = w * Math.abs(Math.cos(angle)) + h * Math.abs(Math.sin(angle));
    const hdSq = (w * w + h * h) / 4;
    return (-K + Math.sqrt(K * K + 4 * (R * R - hdSq))) / 2;
  }
  function minOuterD(angle: number, w: number, h: number, R: number): number {
    const K = w * Math.abs(Math.cos(angle)) + h * Math.abs(Math.sin(angle));
    const hdSq = (w * w + h * h) / 4;
    return (K + Math.sqrt(K * K + 4 * (R * R - hdSq))) / 2;
  }

  test('leaves the position unchanged when the bbox sits fully inside', () => {
    const pos = constrainLabelPosition({ x: 50, y: 0 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBe(50);
    expect(pos.y).toBe(0);
  });

  test('leaves the position unchanged when the bbox sits fully outside', () => {
    const pos = constrainLabelPosition({ x: 115, y: 0 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBe(115);
    expect(pos.y).toBe(0);
  });

  test('snaps inward when the forbidden ring crossing is shorter that way', () => {
    const pos = constrainLabelPosition({ x: 92, y: 0 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBeCloseTo(maxInnerD(0, bbox.w, bbox.h, radius), 5);
    expect(pos.y).toBeCloseTo(0, 5);
  });

  test('snaps outward when the forbidden ring crossing is shorter that way', () => {
    const pos = constrainLabelPosition({ x: 108, y: 0 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBeCloseTo(minOuterD(0, bbox.w, bbox.h, radius), 5);
    expect(pos.y).toBeCloseTo(0, 5);
  });

  test('clamps to the viewBox even when the radial snap would push past the edge', () => {
    const pos = constrainLabelPosition({ x: 300, y: 0 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBe(190);
    expect(pos.y).toBe(0);
  });

  test('forces a too-large bbox to the outside', () => {
    const pos = constrainLabelPosition({ x: 30, y: 0 }, center, radius, { w: 400, h: 400 }, 600);
    const d = Math.hypot(pos.x, pos.y);
    // bbox too big to fit any side → fallback bound R + halfDiag.
    expect(d).toBeGreaterThanOrEqual(radius + 0.5 * Math.hypot(400, 400) - 1e-6);
  });

  test('pushes a centered label outward along the +x fallback when no slice is given', () => {
    // labelPos == center → (px, py) = (0, 0) after translation. Large bbox makes inner
    // infeasible (halfDiag ≥ radius), forcing the outer path through pushOutsideCircle's
    // d == 0 branch and projectRadial's d == 0 branch. With no slice, the fallback angle
    // defaults to 0, so the label lands on the +x axis.
    const pos = constrainLabelPosition({ x: 0, y: 0 }, center, 10, { w: 20, h: 20 }, 100);
    expect(pos.x).toBeGreaterThan(0);
    expect(pos.y).toBeCloseTo(0, 5);
  });

  test('snaps along the radial direction (preserves angle when projecting)', () => {
    // Query (0, 96): label is on the +y axis. Bbox top corner at y=101 > R=100 → snap.
    // Angle-aware max d at π/2 = ~94.5 (narrow side faces origin, so we can get close).
    const pos = constrainLabelPosition({ x: 0, y: 96 }, center, radius, bbox, viewBoxHalf);
    expect(pos.x).toBeCloseTo(0, 5);
    expect(pos.y).toBeCloseTo(maxInnerD(Math.PI / 2, bbox.w, bbox.h, radius), 5);
  });

  test('angle-aware inner bound permits more reach for wide-flat bbox along its narrow axis', () => {
    // A wide-flat label (w >> h) dragged toward the top arc only presents its narrow side
    // to the rim, so the angle-aware bound exceeds the conservative radius − halfDiag cap.
    const wideFlat = { w: 150, h: 16 };
    const conservativeBound = radius - 0.5 * Math.hypot(wideFlat.w, wideFlat.h); // ≈ 24.5 here
    // Drag to (0, 150) — well past the conservative cap on the y-axis.
    const pos = constrainLabelPosition({ x: 0, y: 150 }, center, 180, wideFlat, 250);
    expect(pos.y).toBeGreaterThan(conservativeBound + 50);
  });

  describe('slice wedge (asymmetric: strict inside, loose outside)', () => {
    // Slice spans [-π/2, 0] (top-right quadrant), midAngle = -π/4, sweep = π/2.
    const slice = { startAngle: -Math.PI / 2, endAngle: 0, midAngle: -Math.PI / 4, sweep: Math.PI / 2 };

    function bboxFitsInWedge(p: { x: number; y: number }, w: number, h: number, sliceArg: typeof slice): boolean {
      const nStart = { x: -Math.sin(sliceArg.startAngle), y: Math.cos(sliceArg.startAngle) };
      const nEnd = { x: Math.sin(sliceArg.endAngle), y: -Math.cos(sliceArg.endAngle) };
      const reqStart = Math.abs(nStart.x) * (w / 2) + Math.abs(nStart.y) * (h / 2);
      const reqEnd = Math.abs(nEnd.x) * (w / 2) + Math.abs(nEnd.y) * (h / 2);
      return nStart.x * p.x + nStart.y * p.y >= reqStart - 1e-3 && nEnd.x * p.x + nEnd.y * p.y >= reqEnd - 1e-3;
    }

    test('keeps a label that already fits on the inner side', () => {
      // Sit comfortably on the midAxis, inside the circle, well clear of the radial edges.
      const onAxis = { x: 50 * Math.cos(slice.midAngle), y: 50 * Math.sin(slice.midAngle) };
      const pos = constrainLabelPosition(onAxis, center, radius, bbox, viewBoxHalf, slice);
      expect(pos.x).toBeCloseTo(onAxis.x, 5);
      expect(pos.y).toBeCloseTo(onAxis.y, 5);
    });

    test('inner side pushes a label whose bbox crosses a radial edge back into the wedge', () => {
      // Center on the endAngle ray (angle = 0), inside the circle. Inner candidate should
      // shift the bbox so it doesn't cross the radial edge.
      const pos = constrainLabelPosition({ x: 50, y: 0 }, center, radius, bbox, viewBoxHalf, slice);
      const d = Math.hypot(pos.x, pos.y);
      const halfDiag = 0.5 * Math.hypot(bbox.w, bbox.h);
      // Picked the inner candidate (closer to the query) → bbox-in-wedge must hold.
      expect(d).toBeLessThanOrEqual(radius - halfDiag + 1e-3);
      expect(bboxFitsInWedge(pos, bbox.w, bbox.h, slice)).toBe(true);
    });

    test('narrow slice puts the label just outside the circle on the midAxis (not far out)', () => {
      // sweep = π/12. The shrunk-wedge vertex sits past innerBound → inner infeasible.
      // The outer candidate is on midAxis at the angle-aware minOuterD — close to the
      // slice, not chasing the shrunk-wedge vertex into the viewBox corner.
      const narrow = { startAngle: -Math.PI / 24, endAngle: Math.PI / 24, midAngle: 0, sweep: Math.PI / 12 };
      const wideBbox = { w: 40, h: 20 };
      const desired = { x: 30, y: 0 };
      const pos = constrainLabelPosition(desired, center, radius, wideBbox, viewBoxHalf, narrow);
      expect(pos.y).toBeCloseTo(0, 5);
      expect(pos.x).toBeCloseTo(minOuterD(0, wideBbox.w, wideBbox.h, radius), 5);
    });

    test('outer side does NOT enforce bbox-in-wedge — center on midAxis is enough', () => {
      // Very narrow slice with a fat bbox: bbox would need to be far out to fit angularly,
      // but the loose outer rule keeps it close to the circle. Verify the bbox is allowed
      // to extend past the wedge edges.
      const narrow = { startAngle: -Math.PI / 48, endAngle: Math.PI / 48, midAngle: 0, sweep: Math.PI / 24 };
      const wideBbox = { w: 60, h: 20 };
      const pos = constrainLabelPosition({ x: 50, y: 0 }, center, radius, wideBbox, viewBoxHalf, narrow);
      expect(pos.x).toBeCloseTo(minOuterD(0, wideBbox.w, wideBbox.h, radius), 5);
      expect(pos.y).toBeCloseTo(0, 5);
      // Bbox is NOT in the wedge angularly — that's intentional.
      expect(bboxFitsInWedge(pos, wideBbox.w, wideBbox.h, narrow)).toBe(false);
    });

    test('picks the inner side when it is closer than the outer side', () => {
      // Forbidden ring [88.82, 111.18] for this bbox. Query on slice midAxis at d=90 is in
      // the ring and closer to inner (≈1.2 away) than outer (≈21 away). Wedge is wide.
      const onAxisAtNinety = { x: 90 * Math.cos(slice.midAngle), y: 90 * Math.sin(slice.midAngle) };
      const pos = constrainLabelPosition(onAxisAtNinety, center, radius, bbox, viewBoxHalf, slice);
      const d = Math.hypot(pos.x, pos.y);
      expect(d).toBeLessThan(radius);
    });

    test('picks the outer side when the user drops the label outside the circle', () => {
      // Drop the label past the outer forbidden bound on the midAxis.
      const farOnAxis = { x: 130 * Math.cos(slice.midAngle), y: 130 * Math.sin(slice.midAngle) };
      const pos = constrainLabelPosition(farOnAxis, center, radius, bbox, viewBoxHalf, slice);
      const d = Math.hypot(pos.x, pos.y);
      expect(d).toBeGreaterThan(radius);
    });

    test('skips the wedge when the slice spans more than π', () => {
      const big = { startAngle: -Math.PI / 2, endAngle: -Math.PI / 2 + (3 * Math.PI) / 2, midAngle: Math.PI / 4, sweep: (3 * Math.PI) / 2 };
      const pos = constrainLabelPosition({ x: 50, y: 50 }, center, radius, bbox, viewBoxHalf, big);
      expect(pos.x).toBeCloseTo(50, 5);
      expect(pos.y).toBeCloseTo(50, 5);
    });
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

describe('nudgeOuterLabelsTangentially', () => {
  const center = { cx: 0, cy: 0 };
  const viewBoxHalf = 500;

  test('leaves non-overlapping labels alone', () => {
    const a = { id: 'a', pos: { x: 100, y: 0 }, bbox: { w: 20, h: 10 } };
    const b = { id: 'b', pos: { x: 0, y: 100 }, bbox: { w: 20, h: 10 } };
    const result = nudgeOuterLabelsTangentially([a, b], center, null, viewBoxHalf);
    expect(result[0].pos).toEqual({ x: 100, y: 0 });
    expect(result[1].pos).toEqual({ x: 0, y: 100 });
  });

  test('separates two overlapping labels at the same radius', () => {
    // Both at distance 100, only ~5px apart angularly — wide bboxes overlap.
    const a = { id: 'a', pos: { x: 100, y: 0 }, bbox: { w: 80, h: 20 } };
    const b = { id: 'b', pos: { x: 100, y: 5 }, bbox: { w: 80, h: 20 } };
    const result = nudgeOuterLabelsTangentially([a, b], center, null, viewBoxHalf);
    const dx = Math.abs(result[0].pos.x - result[1].pos.x);
    const dy = Math.abs(result[0].pos.y - result[1].pos.y);
    expect(dx >= 80 - 1e-3 || dy >= 20 - 1e-3).toBe(true);
  });

  test('preserves each label distance from origin (tangential push)', () => {
    const a = { id: 'a', pos: { x: 100, y: 0 }, bbox: { w: 80, h: 20 } };
    const b = { id: 'b', pos: { x: 100, y: 5 }, bbox: { w: 80, h: 20 } };
    const result = nudgeOuterLabelsTangentially([a, b], center, null, viewBoxHalf);
    expect(Math.hypot(result[0].pos.x, result[0].pos.y)).toBeCloseTo(100, 3);
    expect(Math.hypot(result[1].pos.x, result[1].pos.y)).toBeCloseTo(Math.hypot(100, 5), 3);
  });

  test('exempts the dragged label from the push', () => {
    const a = { id: 'a', pos: { x: 100, y: 0 }, bbox: { w: 80, h: 20 } };
    const b = { id: 'b', pos: { x: 100, y: 5 }, bbox: { w: 80, h: 20 } };
    const result = nudgeOuterLabelsTangentially([a, b], center, 'a', viewBoxHalf);
    const aResult = result.find(r => r.id === 'a')!;
    const bResult = result.find(r => r.id === 'b')!;
    expect(aResult.pos).toEqual({ x: 100, y: 0 });
    expect(bResult.pos.x !== 100 || bResult.pos.y !== 5).toBe(true);
  });
});

describe('computeLeaderStart', () => {
  test('starts at the bbox edge along the direction toward leaderTo, plus a small gap', () => {
    // Label at (0, 0), leaderTo at (100, 0). Bbox 40×20 → right edge at x=20, gap 4 → start at x=24.
    const start = computeLeaderStart({ x: 0, y: 0 }, { x: 100, y: 0 }, { w: 40, h: 20 });
    expect(start).not.toBeNull();
    expect(start!.x).toBeCloseTo(24, 5);
    expect(start!.y).toBeCloseTo(0, 5);
  });

  test('returns null when the gap would overshoot leaderTo (label too close)', () => {
    // Label at (0, 0), leaderTo at (10, 0). Bbox 40×20 → right edge at x=20, but line length is only 10.
    const start = computeLeaderStart({ x: 0, y: 0 }, { x: 10, y: 0 }, { w: 40, h: 20 });
    expect(start).toBeNull();
  });

  test('uses the y-axis bbox edge when the direction is mostly vertical', () => {
    // Label at (0, 0), leaderTo at (0, 100). Bbox 40×20 → bottom edge at y=10, gap 4 → start at y=14.
    const start = computeLeaderStart({ x: 0, y: 0 }, { x: 0, y: 100 }, { w: 40, h: 20 });
    expect(start).not.toBeNull();
    expect(start!.x).toBeCloseTo(0, 5);
    expect(start!.y).toBeCloseTo(14, 5);
  });
});
