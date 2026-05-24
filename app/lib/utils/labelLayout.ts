import type { LabelOffset } from '@/app/types';

import { polarToCartesian, type Point } from './polar';

export const LABEL_DEFAULT_RADIUS_FRACTION = 0.6;
export const SNAP_ZONE_FRACTION = 0.1;
const AUTO_NUDGE_MAX_PASSES = 6;
const NUDGE_EPSILON_PX = 1;
const LEADER_GAP_PX = 4;

export interface LabelBBox {
  w: number;
  h: number;
}

export interface SliceWedge {
  startAngle: number;
  endAngle: number;
  midAngle: number;
  // endAngle - startAngle, in radians.
  sweep: number;
}

// Adds an offset to the default position. `radial` units are pie radii (additive on top of
// the default 0.6r centroid); `angular` rotates the default direction around the center.
export function applyLabelOffset({ cx, cy, midAngle }: { cx: number; cy: number; midAngle: number }, offset: LabelOffset | undefined, radius: number): Point {
  const radial = offset?.radial ?? 0;
  const angular = offset?.angular ?? 0;
  const effectiveRadius = (LABEL_DEFAULT_RADIUS_FRACTION + radial) * radius;
  return polarToCartesian(cx, cy, effectiveRadius, midAngle + angular);
}

// A leader line is drawn only when the label's center has crossed the pie's outer edge.
// Labels nudged within the pie sit on a colored slice and don't need a connector.
export function isLabelOutsideCircle(labelPos: Point, center: { cx: number; cy: number }, radius: number): boolean {
  const dx = labelPos.x - center.cx;
  const dy = labelPos.y - center.cy;
  return dx * dx + dy * dy > radius * radius;
}

// Snap a label so it sits in one of two feasible regions for the slice:
//   - inner wedge: bbox fully inside the slice AND fully inside the circle
//   - outer wedge: label center in the slice angularly AND distance ≥ outerBound
// The asymmetry is intentional: on the inner side, the bbox must fit (no overflow into
// neighboring slices); on the outer side, the bbox may extend past the slice's outer
// area. That keeps the label close to its slice on narrow wedges instead of drifting
// far outward chasing the shrunk-wedge vertex (which moves to infinity as sweep → 0).
//
// We compute both candidates and pick the one closer to the user's desired position. The
// inner candidate is null when the shrunk-wedge vertex sits past the inner forbidden-ring
// boundary — narrow wedges land here, forcing the label outside.
export function constrainLabelPosition(
  labelPos: Point,
  center: { cx: number; cy: number },
  radius: number,
  bbox: LabelBBox,
  viewBoxHalf: number,
  slice?: SliceWedge
): Point {
  const wedgeActive = slice !== undefined && slice.sweep > 0 && slice.sweep <= Math.PI + 1e-9;
  const halfDiag = 0.5 * Math.hypot(bbox.w, bbox.h);

  const px = labelPos.x - center.cx;
  const py = labelPos.y - center.cy;

  const inner = computeInnerCandidate(px, py, slice, bbox, radius, halfDiag, wedgeActive);
  const outer = computeOuterCandidate(px, py, slice, bbox, radius, halfDiag, viewBoxHalf, wedgeActive);

  let result: Point;
  if (!inner) {
    result = outer;
  } else {
    const dInner = (px - inner.x) ** 2 + (py - inner.y) ** 2;
    const dOuter = (px - outer.x) ** 2 + (py - outer.y) ** 2;
    result = dInner <= dOuter ? inner : outer;
  }

  return { x: result.x + center.cx, y: result.y + center.cy };
}

// Closest point in (shrunk wedge ∩ inner disk) to (px, py), or null when infeasible.
function computeInnerCandidate(
  px: number,
  py: number,
  slice: SliceWedge | undefined,
  bbox: LabelBBox,
  radius: number,
  halfDiag: number,
  wedgeActive: boolean
): Point | null {
  if (halfDiag >= radius) return null;
  if (wedgeActive && slice) {
    const v = shrunkWedgeVertex(slice, bbox);
    if (!bboxFullyInsideCircle(v, bbox, radius)) return null;
  }

  let p = { x: px, y: py };
  for (let iter = 0; iter < 4; iter++) {
    const beforeX = p.x;
    const beforeY = p.y;
    if (wedgeActive && slice) p = projectIntoWedge(p.x, p.y, slice, bbox);
    p = clampInsideCircle(p, bbox, radius, slice?.midAngle);
    if (Math.abs(p.x - beforeX) < 0.01 && Math.abs(p.y - beforeY) < 0.01) break;
  }
  return p;
}

// Closest point in (angular wedge ∩ outer disk ∩ viewBox) to (px, py). The bbox-in-wedge
// constraint is intentionally NOT enforced here — the label sits at the angle-aware outer
// boundary (or close to it) regardless of slice width.
function computeOuterCandidate(
  px: number,
  py: number,
  slice: SliceWedge | undefined,
  bbox: LabelBBox,
  radius: number,
  halfDiag: number,
  viewBoxHalf: number,
  wedgeActive: boolean
): Point {
  let p = { x: px, y: py };
  if (wedgeActive && slice) p = snapCenterIntoWedge(p.x, p.y, slice);
  p = pushOutsideCircle(p, bbox, radius, halfDiag, slice?.midAngle);

  const maxAbsX = Math.max(0, viewBoxHalf - bbox.w / 2);
  const maxAbsY = Math.max(0, viewBoxHalf - bbox.h / 2);
  return {
    x: Math.max(-maxAbsX, Math.min(maxAbsX, p.x)),
    y: Math.max(-maxAbsY, Math.min(maxAbsY, p.y)),
  };
}

// Exact "bbox fits inside circle of radius R" test. The corner farthest from origin is
// (|x|+w/2, |y|+h/2); checking its distance ≤ R is much tighter than the conservative
// halfDiag bound when the bbox is asymmetric and the label sits along its narrow axis.
function bboxFullyInsideCircle(p: Point, bbox: LabelBBox, radius: number): boolean {
  const cornerX = Math.abs(p.x) + bbox.w / 2;
  const cornerY = Math.abs(p.y) + bbox.h / 2;
  return cornerX * cornerX + cornerY * cornerY <= radius * radius + 1e-6;
}

// Exact "bbox fully outside circle of radius R" test. Origin's distance to the rectangle
// is the closest-corner distance (or 0 if origin is inside the rect).
function bboxFullyOutsideCircle(p: Point, bbox: LabelBBox, radius: number): boolean {
  const nearX = Math.max(0, Math.abs(p.x) - bbox.w / 2);
  const nearY = Math.max(0, Math.abs(p.y) - bbox.h / 2);
  return nearX * nearX + nearY * nearY >= radius * radius - 1e-6;
}

// Scale p radially toward origin until the bbox fits inside the circle. Max distance at
// angle θ solves d² + d·K + halfDiag² ≤ R², where K = w|cos θ| + h|sin θ|.
function clampInsideCircle(p: Point, bbox: LabelBBox, radius: number, fallbackAngle: number | undefined): Point {
  if (bboxFullyInsideCircle(p, bbox, radius)) return p;
  const d = Math.hypot(p.x, p.y);
  if (d === 0) return p;
  const target = solveMaxRadiusForBBoxInside(p.x / d, p.y / d, bbox, radius);
  return projectRadial(p.x, p.y, d, Math.max(0, target), fallbackAngle);
}

// Scale p radially outward until the bbox sits fully outside the circle. Min distance at
// angle θ is the larger root of d² − d·K + halfDiag² ≥ R².
function pushOutsideCircle(p: Point, bbox: LabelBBox, radius: number, halfDiag: number, fallbackAngle: number | undefined): Point {
  if (bboxFullyOutsideCircle(p, bbox, radius)) return p;
  const d = Math.hypot(p.x, p.y);
  // Direction: use the label's own angle if it has one, else the slice midAxis.
  let ux: number;
  let uy: number;
  if (d > 0) {
    ux = p.x / d;
    uy = p.y / d;
  } else {
    const angle = fallbackAngle ?? 0;
    ux = Math.cos(angle);
    uy = Math.sin(angle);
  }
  const target = solveMinRadiusForBBoxOutside(ux, uy, bbox, radius, halfDiag);
  return projectRadial(p.x, p.y, d, target, fallbackAngle);
}

function solveMaxRadiusForBBoxInside(ux: number, uy: number, bbox: LabelBBox, radius: number): number {
  const K = bbox.w * Math.abs(ux) + bbox.h * Math.abs(uy);
  const halfDiagSq = (bbox.w * bbox.w + bbox.h * bbox.h) / 4;
  const disc = K * K + 4 * (radius * radius - halfDiagSq);
  if (disc < 0) return 0;
  return (-K + Math.sqrt(disc)) / 2;
}

function solveMinRadiusForBBoxOutside(ux: number, uy: number, bbox: LabelBBox, radius: number, halfDiag: number): number {
  const K = bbox.w * Math.abs(ux) + bbox.h * Math.abs(uy);
  const halfDiagSq = (bbox.w * bbox.w + bbox.h * bbox.h) / 4;
  const disc = K * K + 4 * (radius * radius - halfDiagSq);
  // Fallback for halfDiag > radius (bbox can't even straddle a single side): push very far.
  if (disc < 0) return radius + halfDiag;
  return (K + Math.sqrt(disc)) / 2;
}

// Inward normals of the two radial slice edges plus the half-extent the bbox needs along
// each normal to fit inside the wedge.
function wedgeEdgeNormals(slice: SliceWedge, bbox: LabelBBox): { nStart: Point; nEnd: Point; reqStart: number; reqEnd: number } {
  const nStart = { x: -Math.sin(slice.startAngle), y: Math.cos(slice.startAngle) };
  const nEnd = { x: Math.sin(slice.endAngle), y: -Math.cos(slice.endAngle) };
  const reqStart = Math.abs(nStart.x) * (bbox.w / 2) + Math.abs(nStart.y) * (bbox.h / 2);
  const reqEnd = Math.abs(nEnd.x) * (bbox.w / 2) + Math.abs(nEnd.y) * (bbox.h / 2);
  return { nStart, nEnd, reqStart, reqEnd };
}

// Closed-form projection of (px, py) into the shrunk wedge whose edges are offset inward
// by the bbox's half-extent along each edge's normal. The shrunk wedge has vertex V (the
// intersection of the two shifted edge lines); the closest point in the wedge is V if the
// query lies past both edges, otherwise the perpendicular projection onto the violated
// edge (clamped to the ray that starts at V and points outward).
function projectIntoWedge(px: number, py: number, slice: SliceWedge, bbox: LabelBBox): Point {
  const { nStart, nEnd, reqStart, reqEnd } = wedgeEdgeNormals(slice, bbox);

  const csStart = nStart.x * px + nStart.y * py - reqStart;
  const csEnd = nEnd.x * px + nEnd.y * py - reqEnd;
  if (csStart >= 0 && csEnd >= 0) return { x: px, y: py };

  const v = shrunkWedgeVertex(slice, bbox);
  if (csStart < 0 && csEnd < 0) return v;

  if (csStart < 0) {
    const projX = px - nStart.x * csStart;
    const projY = py - nStart.y * csStart;
    const edgeDirX = Math.cos(slice.startAngle);
    const edgeDirY = Math.sin(slice.startAngle);
    const t = (projX - v.x) * edgeDirX + (projY - v.y) * edgeDirY;
    return t >= 0 ? { x: projX, y: projY } : v;
  }

  const projX = px - nEnd.x * csEnd;
  const projY = py - nEnd.y * csEnd;
  const edgeDirX = Math.cos(slice.endAngle);
  const edgeDirY = Math.sin(slice.endAngle);
  const t = (projX - v.x) * edgeDirX + (projY - v.y) * edgeDirY;
  return t >= 0 ? { x: projX, y: projY } : v;
}

function shrunkWedgeVertex(slice: SliceWedge, bbox: LabelBBox): Point {
  const { reqStart, reqEnd } = wedgeEdgeNormals(slice, bbox);
  const sinSweep = Math.sin(slice.sweep);
  return {
    x: (reqStart * Math.cos(slice.endAngle) + reqEnd * Math.cos(slice.startAngle)) / sinSweep,
    y: (reqStart * Math.sin(slice.endAngle) + reqEnd * Math.sin(slice.startAngle)) / sinSweep,
  };
}

// Snap the label center into the slice's wedge angularly, preserving distance from origin.
// Used for the outer side — the bbox itself is not constrained.
function snapCenterIntoWedge(px: number, py: number, slice: SliceWedge): Point {
  const d = Math.hypot(px, py);
  if (d === 0) return { x: 0, y: 0 };
  const angle = Math.atan2(py, px);
  let delta = (angle - slice.startAngle) % (2 * Math.PI);
  if (delta < 0) delta += 2 * Math.PI;
  if (delta <= slice.sweep) return { x: px, y: py };
  const distPastEnd = delta - slice.sweep;
  const distBackToStart = 2 * Math.PI - delta;
  const snapAngle = distBackToStart < distPastEnd ? slice.startAngle : slice.startAngle + slice.sweep;
  return { x: d * Math.cos(snapAngle), y: d * Math.sin(snapAngle) };
}

function projectRadial(px: number, py: number, d: number, targetDistance: number, fallbackAngle: number | undefined): Point {
  if (d === 0) {
    const angle = fallbackAngle ?? 0;
    return { x: Math.cos(angle) * targetDistance, y: Math.sin(angle) * targetDistance };
  }
  const scale = targetDistance / d;
  return { x: px * scale, y: py * scale };
}

export function isInSnapZone(labelPos: Point, defaultPos: Point, radius: number): boolean {
  const distance = Math.hypot(labelPos.x - defaultPos.x, labelPos.y - defaultPos.y);
  return distance <= radius * SNAP_ZONE_FRACTION;
}

export interface OuterLabel {
  id: string;
  pos: Point;
  bbox: LabelBBox;
}

// Push overlapping outer labels apart along the circle (tangentially), preserving each
// label's distance from origin. The dragged label (if any) is held fixed. Iterates a few
// passes to resolve cascading overlaps. Tangent direction is computed per-label from its
// own angle to origin, so labels at different angles get correctly diverging pushes.
export function nudgeOuterLabelsTangentially(
  labels: OuterLabel[],
  center: { cx: number; cy: number },
  draggedId: string | null,
  viewBoxHalf: number
): OuterLabel[] {
  if (labels.length < 2) return labels;
  const working = labels.map(l => ({ ...l, pos: { x: l.pos.x, y: l.pos.y } }));

  for (let pass = 0; pass < AUTO_NUDGE_MAX_PASSES; pass++) {
    let nudged = false;
    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = working[i];
        const b = working[j];
        const aFixed = a.id === draggedId;
        const bFixed = b.id === draggedId;
        if (aFixed && bFixed) continue;
        if (!aabbOverlaps(a.pos, a.bbox, b.pos, b.bbox)) continue;

        applyTangentialPush(a, b, aFixed, bFixed, center, viewBoxHalf);
        nudged = true;
      }
    }
    if (!nudged) break;
  }
  return working;
}

function aabbOverlaps(aPos: Point, aBBox: LabelBBox, bPos: Point, bBBox: LabelBBox): boolean {
  return Math.abs(aPos.x - bPos.x) < (aBBox.w + bBBox.w) / 2 && Math.abs(aPos.y - bPos.y) < (aBBox.h + bBBox.h) / 2;
}

function applyTangentialPush(a: OuterLabel, b: OuterLabel, aFixed: boolean, bFixed: boolean, center: { cx: number; cy: number }, viewBoxHalf: number): void {
  const ax = a.pos.x - center.cx;
  const ay = a.pos.y - center.cy;
  const bx = b.pos.x - center.cx;
  const by = b.pos.y - center.cy;
  const aDist = Math.hypot(ax, ay);
  const bDist = Math.hypot(bx, by);
  if (aDist === 0 || bDist === 0) return;

  // MTV: minimum overlap along x or y.
  const overlapX = (a.bbox.w + b.bbox.w) / 2 - Math.abs(a.pos.x - b.pos.x);
  const overlapY = (a.bbox.h + b.bbox.h) / 2 - Math.abs(a.pos.y - b.pos.y);
  const pushPx = Math.min(overlapX, overlapY) + NUDGE_EPSILON_PX;

  // CCW tangent at a. Project (b - a) onto it: positive ⇒ b sits CCW from a.
  const aAngle = Math.atan2(ay, ax);
  const tangentAx = -Math.sin(aAngle);
  const tangentAy = Math.cos(aAngle);
  const projAB = (b.pos.x - a.pos.x) * tangentAx + (b.pos.y - a.pos.y) * tangentAy;
  const dirA = projAB >= 0 ? -1 : 1; // a moves away from b

  const aShare = aFixed ? 0 : bFixed ? 1 : 0.5;
  const bShare = bFixed ? 0 : aFixed ? 1 : 0.5;

  if (!aFixed) a.pos = rotateAroundOrigin(center, aAngle, aDist, (dirA * pushPx * aShare) / aDist, a.bbox, viewBoxHalf);
  if (!bFixed) {
    const bAngle = Math.atan2(by, bx);
    b.pos = rotateAroundOrigin(center, bAngle, bDist, (-dirA * pushPx * bShare) / bDist, b.bbox, viewBoxHalf);
  }
}

function rotateAroundOrigin(
  center: { cx: number; cy: number },
  currentAngle: number,
  dist: number,
  dAngle: number,
  bbox: LabelBBox,
  viewBoxHalf: number
): Point {
  const newAngle = currentAngle + dAngle;
  const newX = center.cx + dist * Math.cos(newAngle);
  const newY = center.cy + dist * Math.sin(newAngle);
  // Re-clamp to viewBox so the push can't drive labels off the canvas.
  const maxAbsX = Math.max(0, viewBoxHalf - bbox.w / 2);
  const maxAbsY = Math.max(0, viewBoxHalf - bbox.h / 2);
  return {
    x: Math.max(center.cx - maxAbsX, Math.min(center.cx + maxAbsX, newX)),
    y: Math.max(center.cy - maxAbsY, Math.min(center.cy + maxAbsY, newY)),
  };
}

// Where the leader line should start: at the bbox edge along the direction toward
// `leaderTo`, offset outward by a small gap so the line doesn't touch the text. Returns
// null when the gap would overshoot leaderTo (label is too close to the slice for a line).
export function computeLeaderStart(labelPos: Point, leaderTo: Point, bbox: LabelBBox): Point | null {
  const dx = leaderTo.x - labelPos.x;
  const dy = leaderTo.y - labelPos.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return null;
  const tx = Math.abs(dx) > 1e-9 ? bbox.w / 2 / Math.abs(dx) : Infinity;
  const ty = Math.abs(dy) > 1e-9 ? bbox.h / 2 / Math.abs(dy) : Infinity;
  const tEdge = Math.min(tx, ty);
  const totalT = tEdge + LEADER_GAP_PX / len;
  if (totalT >= 1) return null;
  return { x: labelPos.x + dx * totalT, y: labelPos.y + dy * totalT };
}
