'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import { LABEL_PADDING_FRACTION, RenderedEntry, useChartData } from '@/app/lib/hooks/useChartData';
import { LEADER_LINE_COLOR, OUTSIDE_TEXT_COLOR } from '@/app/lib/utils/constants';
import { activityLayoutKey, wrapLabelText } from '@/app/lib/utils/imageExport';
import { LabelBBox } from '@/app/lib/utils/labelLayout';
import type { Activity, ChartType } from '@/app/types';

// Deterministic, dependency-free fonts so the serialized SVG rasterizes identically across
// machines. A web-font @import would be an external reference that taints the export canvas.
export const EXPORT_FONT_FAMILY = 'system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
// Vertical space reserved above the chart for the centered title <text>.
export const EXPORT_TITLE_HEIGHT = 52;

const TITLE_FONT_SIZE = 22;
const NAME_FONT_SIZE = 15;
const DETAILS_FONT_SIZE = 11;
const LINE_HEIGHT_RATIO = 1.15;
// Label box width budget in chart user units, mirroring the live foreignObject label box.
const LABEL_WRAP_WIDTH = 190;
// Baseline sits ~0.8 down each line box so the wrapped block reads as vertically centered.
const BASELINE_RATIO = 0.8;

const EMPTY_BBOXES: Record<string, LabelBBox> = {};

interface ChartExportSvgProps {
  activities: Activity[];
  chartType: ChartType;
  size: number;
  title: string;
  // Fired once the two-pass measured layout is committed (immediately for a label-less chart).
  onReady?: () => void;
}

function measureLabels(root: SVGGElement): Record<string, LabelBBox> {
  const next: Record<string, LabelBBox> = {};
  root.querySelectorAll<SVGGraphicsElement>('[data-export-label-text]').forEach(el => {
    const id = el.getAttribute('data-export-label-text');
    if (!id) return;
    const box = el.getBBox();
    next[id] = { w: box.width, h: box.height };
  });
  return next;
}

// Presentational, foreignObject-free chart renderer for image export. Native <text> labels
// survive SVG→canvas rasterization where the live foreignObject labels blank out (WebKit).
// Reuses useChartData for geometry, then a two-pass getBBox measurement so label placement
// matches the on-screen chart rather than the crude estimateBBox fallback.
export function ChartExportSvg({ activities, chartType, size, title, onReady }: ChartExportSvgProps) {
  const rootRef = useRef<SVGGElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const firedKeyRef = useRef<string | null>(null);

  const [measuredBBoxes, setMeasuredBBoxes] = useState<Record<string, LabelBBox>>(EMPTY_BBOXES);
  const [measuredKey, setMeasuredKey] = useState<string | null>(null);

  const renderedEntries = useMemo<RenderedEntry[]>(() => [...activities], [activities]);

  // Identity of the inputs that determine the layout. When it changes, the previously measured
  // bboxes no longer apply, so the chart falls back to the estimate and re-measures.
  const inputKey = useMemo(() => `${size}|${chartType}|${activityLayoutKey(activities)}`, [size, chartType, activities]);

  const isMeasured = measuredKey === inputKey;

  const chartSize = size / LABEL_PADDING_FRACTION;
  const { slices, labels } = useChartData({
    renderedEntries,
    draggedLabelId: null,
    labelBBoxes: isMeasured ? measuredBBoxes : EMPTY_BBOXES,
    editingActivity: null,
    chartType,
    chartSize,
  });

  const labelCount = labels.length;

  useEffect(() => {
    const fireReady = () => {
      if (firedKeyRef.current === inputKey) return;
      firedKeyRef.current = inputKey;
      onReadyRef.current?.();
    };

    // A label-less chart (empty or no activities) has nothing to measure — signal ready at once
    // so an aggregate consumer isn't left waiting forever on the empty side.
    if (labelCount === 0) {
      fireReady();
      return;
    }
    if (!isMeasured) {
      const root = rootRef.current;
      if (!root) return;
      setMeasuredBBoxes(measureLabels(root));
      setMeasuredKey(inputKey);
      return;
    }
    fireReady();
  }, [inputKey, isMeasured, labelCount]);

  return (
    <g ref={rootRef}>
      <text
        x={size / 2}
        y={EXPORT_TITLE_HEIGHT * 0.62}
        textAnchor="middle"
        fontFamily={EXPORT_FONT_FAMILY}
        fontSize={TITLE_FONT_SIZE}
        fontWeight={600}
        fill={OUTSIDE_TEXT_COLOR}>
        {title}
      </text>
      <g transform={`translate(${size / 2}, ${EXPORT_TITLE_HEIGHT + size / 2})`}>
        {slices.map(slice => (
          <path key={slice.id} d={slice.pathD} fill={slice.fillColor} stroke={slice.borderColor} strokeWidth={2} />
        ))}
        {labels.map(label => {
          const nameLines = wrapLabelText(label.name, LABEL_WRAP_WIDTH, NAME_FONT_SIZE);
          const detailsLines = label.details ? label.details.split('\n').flatMap(segment => wrapLabelText(segment, LABEL_WRAP_WIDTH, DETAILS_FONT_SIZE)) : [];
          const nameLineHeight = NAME_FONT_SIZE * LINE_HEIGHT_RATIO;
          const detailsLineHeight = DETAILS_FONT_SIZE * LINE_HEIGHT_RATIO;
          const totalHeight = nameLines.length * nameLineHeight + detailsLines.length * detailsLineHeight;
          const top = label.y - totalHeight / 2;
          const color = label.isOutside ? OUTSIDE_TEXT_COLOR : label.insideTextColor;
          return (
            <g key={label.id}>
              {label.leaderTo && label.leaderFrom && (
                <line x1={label.leaderFrom.x} y1={label.leaderFrom.y} x2={label.leaderTo.x} y2={label.leaderTo.y} stroke={LEADER_LINE_COLOR} strokeWidth={1} />
              )}
              <text data-export-label-text={label.id} textAnchor="middle" fontFamily={EXPORT_FONT_FAMILY} fill={color}>
                {nameLines.map((line, i) => (
                  <tspan key={`name-${i}`} x={label.x} y={top + (i + BASELINE_RATIO) * nameLineHeight} fontSize={NAME_FONT_SIZE} fontWeight="bold">
                    {line}
                  </tspan>
                ))}
                {detailsLines.map((line, j) => (
                  <tspan
                    key={`details-${j}`}
                    x={label.x}
                    y={top + nameLines.length * nameLineHeight + (j + BASELINE_RATIO) * detailsLineHeight}
                    fontSize={DETAILS_FONT_SIZE}
                    fontWeight="normal">
                    {line}
                  </tspan>
                ))}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
