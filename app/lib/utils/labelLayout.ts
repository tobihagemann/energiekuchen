import type { LabelOffset } from '@/app/types';

import { normalizeAngle, polarToCartesian, type Point } from './polar';

export const LABEL_DEFAULT_RADIUS_FRACTION = 0.6;
export const LEADER_LINE_THRESHOLD_FRACTION = 0.15;
export const SNAP_ZONE_FRACTION = 0.1;
export const AUTO_NUDGE_MAX_PASSES = 4;

export interface LabelBBox {
  w: number;
  h: number;
}

export interface LabelLayoutInput {
  id: string;
  x: number;
  y: number;
  bbox: LabelBBox;
  midAngle: number;
  draggedId?: string | null;
}

export interface LabelLayoutResult {
  id: string;
  x: number;
  y: number;
}

export function computeDefaultLabelPosition({ cx, cy, radius, midAngle }: { cx: number; cy: number; radius: number; midAngle: number }): Point {
  return polarToCartesian(cx, cy, radius * LABEL_DEFAULT_RADIUS_FRACTION, midAngle);
}

// Adds an offset to the default position. `radial` units are pie radii (additive on top of
// the default 0.6r centroid); `angular` rotates the default direction around the center.
export function applyLabelOffset({ cx, cy, midAngle }: { cx: number; cy: number; midAngle: number }, offset: LabelOffset | undefined, radius: number): Point {
  const radial = offset?.radial ?? 0;
  const angular = offset?.angular ?? 0;
  const effectiveRadius = (LABEL_DEFAULT_RADIUS_FRACTION + radial) * radius;
  return polarToCartesian(cx, cy, effectiveRadius, midAngle + angular);
}

export function shouldShowLeaderLine(labelPos: Point, centroid: Point, radius: number): boolean {
  const distance = Math.hypot(labelPos.x - centroid.x, labelPos.y - centroid.y);
  return distance >= radius * LEADER_LINE_THRESHOLD_FRACTION;
}

export function isInSnapZone(labelPos: Point, defaultPos: Point, radius: number): boolean {
  const distance = Math.hypot(labelPos.x - defaultPos.x, labelPos.y - defaultPos.y);
  return distance <= radius * SNAP_ZONE_FRACTION;
}

function overlaps(a: LabelLayoutInput & LabelLayoutResult, b: LabelLayoutInput & LabelLayoutResult): boolean {
  const dx = Math.abs(a.x - b.x);
  const dy = Math.abs(a.y - b.y);
  return dx < (a.bbox.w + b.bbox.w) / 2 && dy < (a.bbox.h + b.bbox.h) / 2;
}

// Greedy tangential-then-radial nudge. Caps at 4 passes per R27; residual overlap
// after the cap is accepted. The dragged label is exempt — the user's hand wins.
export function autoNudgeLabels(positions: LabelLayoutInput[], radius: number, pieCenter: { cx: number; cy: number } = { cx: 0, cy: 0 }): LabelLayoutResult[] {
  const working = positions.map(p => ({ ...p, x: p.x, y: p.y }));

  for (let pass = 0; pass < AUTO_NUDGE_MAX_PASSES; pass++) {
    let nudgedAny = false;

    for (let i = 0; i < working.length; i++) {
      for (let j = i + 1; j < working.length; j++) {
        const a = working[i];
        const b = working[j];
        if (!overlaps(a, b)) continue;

        const aFixed = a.draggedId === a.id;
        const bFixed = b.draggedId === b.id;
        if (aFixed && bFixed) continue;
        const mover = aFixed ? b : a;

        const overlapX = (a.bbox.w + b.bbox.w) / 2 - Math.abs(a.x - b.x);
        const overlapY = (a.bbox.h + b.bbox.h) / 2 - Math.abs(a.y - b.y);

        const tangential = normalizeAngle(mover.midAngle + Math.PI / 2);
        const tx = Math.cos(tangential);
        const ty = Math.sin(tangential);

        const tangentialAmount = Math.min(overlapX, overlapY) + 0.5;
        mover.x += tx * tangentialAmount * (mover === a ? -1 : 1);
        mover.y += ty * tangentialAmount * (mover === a ? -1 : 1);

        if (overlaps(a, b)) {
          const radial = mover.midAngle;
          const rx = Math.cos(radial);
          const ry = Math.sin(radial);
          const radialAmount = Math.max(overlapX, overlapY) + 0.5;
          mover.x += rx * radialAmount;
          mover.y += ry * radialAmount;
        }

        // Keep the mover oriented around the pie center even if the radial direction
        // was applied; without this, very-far labels could drift unboundedly past
        // the SVG viewport.
        const dx = mover.x - pieCenter.cx;
        const dy = mover.y - pieCenter.cy;
        const maxOffset = radius * 1.5;
        const distance = Math.hypot(dx, dy);
        if (distance > maxOffset) {
          const scale = maxOffset / distance;
          mover.x = pieCenter.cx + dx * scale;
          mover.y = pieCenter.cy + dy * scale;
        }

        nudgedAny = true;
      }
    }

    if (!nudgedAny) break;
  }

  return working.map(({ id, x, y }) => ({ id, x, y }));
}
