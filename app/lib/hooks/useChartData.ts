'use client';

import { useMemo } from 'react';

import { getColorForPolarity } from '@/app/lib/utils/constants';
import { applyLabelOffset, autoNudgeLabels, computeDefaultLabelPosition, LabelBBox, shouldShowLeaderLine } from '@/app/lib/utils/labelLayout';
import { polarToCartesian } from '@/app/lib/utils/polar';
import type { Activity, ChartType, LabelOffset, Polarity } from '@/app/types';

export type RenderedEntry = Activity;

export interface SliceGeometry {
  id: string;
  name: string;
  details?: string;
  polarity: Polarity;
  startAngle: number;
  endAngle: number;
  midAngle: number;
  normalized: number;
  displayedWeight: number;
  pathD: string;
  fillColor: string;
  hoverFillColor: string;
  borderColor: string;
  hoverBorderColor: string;
  isFullCircle: boolean;
}

export interface LabelGeometry {
  id: string;
  name: string;
  details?: string;
  x: number;
  y: number;
  midAngle: number;
  leaderTo: { x: number; y: number } | null;
  centroid: { x: number; y: number };
}

interface ChartLayout {
  cx: number;
  cy: number;
  radius: number;
  viewBox: string;
  sizePx: number;
}

interface UseChartDataInput {
  renderedEntries: RenderedEntry[];
  displayedWeights: number[];
  displayedOffsets: Array<LabelOffset | undefined>;
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
const LABEL_PADDING_FRACTION = 1.2;
const START_ANGLE = -Math.PI / 2;

export function useChartData(input: UseChartDataInput): UseChartDataResult {
  const { renderedEntries, displayedWeights, displayedOffsets, labelBBoxes, editingActivity, chartType, chartSize } = input;

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
        midAngle: 0,
        normalized: 1,
        displayedWeight: 0,
        pathD: fullCirclePath(cx, cy, radius),
        fillColor: EMPTY_CHART_COLOR,
        hoverFillColor: EMPTY_CHART_HOVER,
        borderColor: 'oklch(1 0 0)',
        hoverBorderColor: 'oklch(1 0 0)',
        isFullCircle: true,
      };
      return { slices: [slice], labels: [], layout, isEmpty: true };
    }

    const total = displayedWeights.reduce((sum, w) => sum + w, 0) || 1;
    const slices: SliceGeometry[] = [];
    const labelInputs: Array<{
      id: string;
      name: string;
      details?: string;
      centroid: { x: number; y: number };
      offsetPos: { x: number; y: number };
      midAngle: number;
      bbox: LabelBBox;
    }> = [];

    let cursor = START_ANGLE;
    for (let i = 0; i < renderedEntries.length; i++) {
      const entry = renderedEntries[i];
      const weight = displayedWeights[i] ?? entry.weight;
      const sweep = (weight / total) * Math.PI * 2;
      const start = cursor;
      const end = cursor + sweep;
      const mid = start + sweep / 2;
      cursor = end;

      const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === entry.id;
      const baseColor = getColorForPolarity(entry.polarity);

      const isFullCircle = renderedEntries.length === 1;
      const pathD = isFullCircle ? fullCirclePath(cx, cy, radius) : slicePath(cx, cy, radius, start, end);

      slices.push({
        id: entry.id,
        name: entry.name,
        details: entry.details,
        polarity: entry.polarity,
        startAngle: start,
        endAngle: end,
        midAngle: mid,
        normalized: weight / total,
        displayedWeight: weight,
        pathD,
        fillColor: baseColor,
        hoverFillColor: `oklch(from ${baseColor} calc(l + 0.1) c h)`,
        borderColor: isActive ? `oklch(from ${baseColor} calc(l - 0.1) c h)` : 'oklch(1 0 0)',
        hoverBorderColor: isActive ? `oklch(from ${baseColor} calc(l - 0.1) c h)` : 'oklch(1 0 0)',
        isFullCircle,
      });

      const centroid = computeDefaultLabelPosition({ cx, cy, radius, midAngle: mid });
      const offset = displayedOffsets[i];
      const offsetPos = applyLabelOffset({ cx, cy, midAngle: mid }, offset, radius);
      const bbox = labelBBoxes[entry.id] ?? estimateBBox(entry);

      labelInputs.push({
        id: entry.id,
        name: entry.name,
        details: entry.details,
        centroid,
        offsetPos,
        midAngle: mid,
        bbox,
      });
    }

    const nudged = autoNudgeLabels(
      labelInputs.map(l => ({ id: l.id, x: l.offsetPos.x, y: l.offsetPos.y, bbox: l.bbox, midAngle: l.midAngle })),
      radius,
      { cx, cy }
    );

    const labels: LabelGeometry[] = labelInputs.map((l, i) => {
      const pos = nudged[i];
      const leaderTo = shouldShowLeaderLine(pos, l.centroid, radius) ? l.centroid : null;
      return {
        id: l.id,
        name: l.name,
        details: l.details,
        x: pos.x,
        y: pos.y,
        midAngle: l.midAngle,
        leaderTo,
        centroid: l.centroid,
      };
    });

    return { slices, labels, layout, isEmpty: false };
  }, [renderedEntries, displayedWeights, displayedOffsets, labelBBoxes, editingActivity, chartType, chartSize]);
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
