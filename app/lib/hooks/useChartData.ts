'use client';

import { useMemo } from 'react';

import {
  applyLabelOffset,
  computeLeaderStart,
  constrainLabelPosition,
  LabelBBox,
  nudgeOuterLabelsTangentially,
  type SliceWedge,
} from '@/app/lib/utils/labelLayout';
import { polarToCartesian } from '@/app/lib/utils/polar';
import { assignShadeDepths, getActiveBorderExpr, getInsideTextColor, getShadeColor } from '@/app/lib/utils/shade';
import { computeStartAngles, START_ANGLE } from '@/app/lib/utils/sliceAngles';
import type { Activity, ChartType, Polarity } from '@/app/types';

// Entries flow in from `useAnimatedRenderedEntries`, which marks slices fading out from a
// deletion as `isGhost: true`. Ghost slices still render (shrinking weight → vanishing
// path), but their labels and layout participation are suppressed inside this hook.
// `startAngle`/`shadeDepth` are the animated channels; absent on a plain activity, in which
// case this hook walks the contiguous angles and ranks the depths itself.
export type RenderedEntry = Activity & { isGhost?: boolean; startAngle?: number; shadeDepth?: number };

export interface SliceGeometry {
  id: string;
  name: string;
  polarity: Polarity;
  startAngle: number;
  endAngle: number;
  weight: number;
  pathD: string;
  fillColor: string;
  hoverFillColor: string;
  borderColor: string;
  hoverBorderColor: string;
}

export interface LabelGeometry {
  id: string;
  name: string;
  details?: string;
  x: number;
  y: number;
  midAngle: number;
  // Leader line endpoint on the pie's outer edge (at the slice arc midpoint), or null
  // when no leader line is needed.
  leaderTo: { x: number; y: number } | null;
  // Leader line start point at the bbox edge plus a small gap. Null when no line should
  // be drawn (no leaderTo, or the gap overshoots the leader endpoint).
  leaderFrom: { x: number; y: number } | null;
  isOutside: boolean;
  // Adaptive text color for an inside label, keyed on the slice's shade depth so it stays
  // legible on both pale and dark fills. Outside labels use the canvas gray-900 instead.
  insideTextColor: string;
}

interface ChartLayout {
  cx: number;
  cy: number;
  radius: number;
  viewBox: string;
  sizePx: number;
}

interface UseChartDataInput {
  // Entries already carry the displayed weight and labelOffset (the animated values during
  // an animation; the live target values otherwise).
  renderedEntries: RenderedEntry[];
  // Active label drag, if any. Excluded from the tangential overlap nudge so the dragged
  // label stays at the cursor while neighbors move around it.
  draggedLabelId: string | null;
  labelBBoxes: Record<string, LabelBBox>;
  editingActivity: { chartType: ChartType; activityId: string } | null;
  chartType: ChartType;
  chartSize: number;
}

export interface UseChartDataResult {
  slices: SliceGeometry[];
  labels: LabelGeometry[];
  layout: ChartLayout;
  isEmpty: boolean;
}

const EMPTY_CHART_COLOR = 'oklch(0.967 0.003 264.542)';
const EMPTY_CHART_HOVER = 'oklch(0.985 0.002 247.839)';
// Fraction by which the viewBox exceeds the chart diameter, leaving room for outside labels.
export const LABEL_PADDING_FRACTION = 1.2;

export function useChartData(input: UseChartDataInput): UseChartDataResult {
  const { renderedEntries, draggedLabelId, labelBBoxes, editingActivity, chartType, chartSize } = input;

  return useMemo(() => {
    const radius = chartSize / 2;
    const viewBoxEdge = chartSize * LABEL_PADDING_FRACTION;
    const cx = 0;
    const cy = 0;
    const viewBox = `${-viewBoxEdge / 2} ${-viewBoxEdge / 2} ${viewBoxEdge} ${viewBoxEdge}`;
    const layout: ChartLayout = {
      cx,
      cy,
      radius,
      viewBox,
      sizePx: viewBoxEdge,
    };

    if (renderedEntries.length === 0) {
      const slice: SliceGeometry = {
        id: '__empty__',
        name: '',
        polarity: 'positive',
        startAngle: START_ANGLE,
        endAngle: START_ANGLE + Math.PI * 2,
        weight: 0,
        pathD: fullCirclePath(cx, cy, radius),
        fillColor: EMPTY_CHART_COLOR,
        hoverFillColor: EMPTY_CHART_HOVER,
        borderColor: 'oklch(1 0 0)',
        hoverBorderColor: 'oklch(1 0 0)',
      };
      return { slices: [slice], labels: [], layout, isEmpty: true };
    }

    const total = renderedEntries.reduce((sum, e) => sum + e.weight, 0) || 1;
    const slices: SliceGeometry[] = [];
    const labelInputs: Array<{
      id: string;
      name: string;
      details?: string;
      offsetPos: { x: number; y: number };
      midAngle: number;
      bbox: LabelBBox;
      slice: SliceWedge;
      insideTextColor: string;
    }> = [];

    // Use the animated start angles only when every entry carries one (all-or-nothing: a
    // single gap would mix animated starts with a cumulative fallback and break the ring);
    // otherwise walk the contiguous angles ourselves. Depths follow the same contract —
    // recompute the whole ring (ghost-exclusive) if any entry lacks a precomputed depth.
    const startAngles = renderedEntries.every(e => e.startAngle !== undefined)
      ? renderedEntries.map(e => e.startAngle as number)
      : computeStartAngles(
          renderedEntries.map(e => e.weight),
          START_ANGLE
        );
    const fallbackDepths = renderedEntries.some(e => e.shadeDepth === undefined) ? assignShadeDepths(renderedEntries.filter(e => !e.isGhost)) : null;

    for (let i = 0; i < renderedEntries.length; i++) {
      const entry = renderedEntries[i];
      const weight = entry.weight;
      const sweep = (weight / total) * Math.PI * 2;
      const start = startAngles[i];
      const end = start + sweep;
      const mid = start + sweep / 2;

      const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === entry.id;
      // When the fallback is engaged it owns the whole ring (a ghost, excluded from ranking,
      // lands on the mid 0.5); otherwise every entry already carries its animated depth.
      const depth = fallbackDepths ? (fallbackDepths[entry.id] ?? 0.5) : (entry.shadeDepth as number);
      const shadedColor = getShadeColor(entry.polarity, depth);

      const isFullCircle = renderedEntries.length === 1;
      const pathD = isFullCircle ? fullCirclePath(cx, cy, radius) : slicePath(cx, cy, radius, start, end);

      slices.push({
        id: entry.id,
        name: entry.name,
        polarity: entry.polarity,
        startAngle: start,
        endAngle: end,
        weight,
        pathD,
        fillColor: shadedColor,
        hoverFillColor: `oklch(from ${shadedColor} calc(l + 0.1) c h)`,
        borderColor: isActive ? getActiveBorderExpr(shadedColor, depth) : 'oklch(1 0 0)',
        hoverBorderColor: isActive ? getActiveBorderExpr(shadedColor, depth) : 'oklch(1 0 0)',
      });

      // Ghost slices keep rendering (their path shrinks during the deletion animation),
      // but they don't contribute a label — and they must not occupy a layout slot, or
      // their stale full-size bbox could push visible labels around as their slice sweep
      // approaches zero.
      if (entry.isGhost) continue;

      const offsetPos = applyLabelOffset({ cx, cy, midAngle: mid }, entry.labelOffset, radius);
      const bbox = labelBBoxes[entry.id] ?? estimateBBox(entry);

      labelInputs.push({
        id: entry.id,
        name: entry.name,
        details: entry.details,
        offsetPos,
        midAngle: mid,
        bbox,
        slice: { startAngle: start, endAngle: end, midAngle: mid, sweep },
        insideTextColor: getInsideTextColor(depth),
      });
    }

    const viewBoxHalf = viewBoxEdge / 2;
    const center = { cx, cy };
    const constrainedPositions = labelInputs.map(l => {
      const { pos, placement } = constrainLabelPosition(l.offsetPos, center, radius, l.bbox, viewBoxHalf, l.slice);
      return { id: l.id, pos, bbox: l.bbox, isOutside: placement === 'outer' };
    });

    // Tangential overlap nudge among outer labels (skip dragged). Inner labels are
    // separated by construction (each fully contained in its own slice ∩ inner disk).
    const outerLabels = constrainedPositions.filter(l => l.isOutside).map(l => ({ id: l.id, pos: l.pos, bbox: l.bbox }));
    const nudgedOuter = nudgeOuterLabelsTangentially(outerLabels, center, draggedLabelId, viewBoxHalf);
    const nudgedById = new Map(nudgedOuter.map(n => [n.id, n.pos]));

    const labels: LabelGeometry[] = labelInputs.map((l, i) => {
      const constrained = nudgedById.get(l.id) ?? constrainedPositions[i].pos;
      const isOutside = constrainedPositions[i].isOutside;
      // Leader line attaches to the slice's arc midpoint on the circle, not the radial
      // projection of the label — the connector stays at the slice's "center" even when
      // the user drags the label tangentially.
      const leaderTo = isOutside ? polarToCartesian(cx, cy, radius, l.midAngle) : null;
      const leaderFrom = leaderTo ? computeLeaderStart(constrained, leaderTo, l.bbox) : null;
      return {
        id: l.id,
        name: l.name,
        details: l.details,
        x: constrained.x,
        y: constrained.y,
        midAngle: l.midAngle,
        leaderTo,
        leaderFrom,
        isOutside,
        insideTextColor: l.insideTextColor,
      };
    });

    return { slices, labels, layout, isEmpty: false };
  }, [renderedEntries, draggedLabelId, labelBBoxes, editingActivity, chartType, chartSize]);
}

function slicePath(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, r, startAngle);
  const end = polarToCartesian(cx, cy, r, endAngle);
  const largeArcFlag = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
}

function fullCirclePath(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r} Z`;
}

function estimateBBox(entry: { name: string; details?: string }): LabelBBox {
  return {
    w: entry.name.length * 7 + 8,
    h: entry.details ? 32 : 16,
  };
}
