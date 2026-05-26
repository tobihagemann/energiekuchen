'use client';

import { useRef, useState } from 'react';

import type { SliceGeometry } from '@/app/lib/hooks/useChartData';
import type { BoundaryHandle } from '@/app/lib/hooks/usePieDrag';
import { DEFAULT_LABEL_OFFSET } from '@/app/lib/utils/constants';
import { getFloor } from '@/app/lib/utils/floor';
import { getPercentage } from '@/app/lib/utils/percentage';
import { redistributeTwoDonor, type WeightEntry } from '@/app/lib/utils/redistribution';
import { validateLabelOffset } from '@/app/lib/utils/validation';
import type { ChartType, LabelOffset } from '@/app/types';

interface PieSliceProps {
  slice: SliceGeometry;
  index: number;
  renderedEntries: WeightEntry[];
  chartType: ChartType;
  total: number;
  readOnly: boolean;
  ariaLabel: string;
  currentLabelOffset: LabelOffset | undefined;
  onActivityClick?: (id: string) => void;
  setActivityWeights: (chartType: ChartType, entries: WeightEntry[]) => void;
  setLabelOffset: (chartType: ChartType, activityId: string, offset: LabelOffset | null) => void;
  onAnnounce: (message: string) => void;
}

const DRAG_VS_CLICK_TOLERANCE = 4;
const ANGULAR_STEP = Math.PI / 36;
const RADIAL_STEP = 0.05;
// Boundary handle hit zone starts at this fraction of the radius so that adjacent
// boundaries don't all overlap at the chart center. Below this, the cursor pile-up
// would let a click on slice A's body capture slice B's boundary instead.
const BOUNDARY_HIT_INNER_FRACTION = 0.15;

export function PieSlice(props: PieSliceProps) {
  const {
    slice,
    index,
    renderedEntries,
    chartType,
    total,
    readOnly,
    ariaLabel,
    currentLabelOffset,
    onActivityClick,
    setActivityWeights,
    setLabelOffset,
    onAnnounce,
  } = props;
  const [isHovered, setIsHovered] = useState(false);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (readOnly || !onActivityClick || !start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    if (Math.hypot(dx, dy) <= DRAG_VS_CLICK_TOLERANCE) {
      onActivityClick(slice.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (!readOnly && onActivityClick) onActivityClick(slice.id);
      return;
    }

    if (readOnly) return;

    if (e.key === 'Escape') {
      if (currentLabelOffset) {
        e.preventDefault();
        setLabelOffset(chartType, slice.id, null);
        onAnnounce('Label zurückgesetzt');
      }
      return;
    }

    const isShift = e.shiftKey;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      const N = renderedEntries.length;
      if (N <= 1) return;
      const floor = getFloor(total);

      if (isShift) {
        const current = currentLabelOffset ?? DEFAULT_LABEL_OFFSET;
        let next: LabelOffset = { ...current };
        if (e.key === 'ArrowRight') next.angular = current.angular + ANGULAR_STEP;
        else if (e.key === 'ArrowLeft') next.angular = current.angular - ANGULAR_STEP;
        else if (e.key === 'ArrowUp') next.radial = current.radial + RADIAL_STEP;
        else next.radial = current.radial - RADIAL_STEP;
        const validation = validateLabelOffset(next);
        if (validation.isValid && validation.normalized) {
          setLabelOffset(chartType, slice.id, validation.normalized);
          onAnnounce('Label verschoben');
        }
        return;
      }

      const clockwise = e.key === 'ArrowRight' || e.key === 'ArrowUp';
      const donorIndex = clockwise ? (index + 1) % N : (index - 1 + N) % N;
      const donor = renderedEntries[donorIndex];
      if (donor.weight <= floor) return;
      const step = Math.min(total * 0.01, donor.weight - floor);
      const next = redistributeTwoDonor(renderedEntries, index, donorIndex, step, floor);
      const changed: WeightEntry[] = [
        { id: next[index].id, weight: next[index].weight },
        { id: next[donorIndex].id, weight: next[donorIndex].weight },
      ];
      setActivityWeights(chartType, changed);
      const newTotal = next.reduce((s, w) => s + w.weight, 0);
      onAnnounce(`${slice.name}: ${getPercentage(next[index].weight, newTotal)} %`);
    }
  };

  const fill = isHovered ? slice.hoverFillColor : slice.fillColor;
  const stroke = isHovered ? slice.hoverBorderColor : slice.borderColor;

  return (
    <g>
      <path
        d={slice.pathD}
        fill={fill}
        stroke={stroke}
        strokeWidth={2}
        // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- HTML <button> can't render an SVG path with the right pointer geometry; role="button" + tabindex + key handlers is the WAI-ARIA pattern for SVG-shaped controls
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        data-testid={`pie-slice-${slice.id}`}
        style={{ cursor: readOnly && !onActivityClick ? 'default' : 'pointer', outline: 'none' }}
        onPointerEnter={() => setIsHovered(true)}
        onPointerLeave={() => setIsHovered(false)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onKeyDown={handleKeyDown}
      />
    </g>
  );
}

interface BoundaryRectProps {
  cx: number;
  cy: number;
  radius: number;
  angle: number;
  boundaryHandle: BoundaryHandle;
  isCoarsePointer: boolean;
  readOnly: boolean;
  onBoundaryPointerDown: (handle: BoundaryHandle, e: React.PointerEvent) => void;
}

export function BoundaryRect({ cx, cy, radius, angle, boundaryHandle, isCoarsePointer, readOnly, onBoundaryPointerDown }: BoundaryRectProps) {
  const [isHovered, setIsHovered] = useState(false);
  const hitWidth = isCoarsePointer ? 24 : 12;
  const indicatorWidth = 3;
  const angleDeg = (angle * 180) / Math.PI;
  const cursor = pickResizeCursor(angle);
  const hitX = radius * BOUNDARY_HIT_INNER_FRACTION;
  const hitW = radius - hitX;
  const showIndicator = !readOnly && isHovered;

  return (
    <g
      transform={`translate(${cx} ${cy}) rotate(${angleDeg})`}
      style={{ cursor: readOnly ? 'default' : cursor, touchAction: 'none' }}
      data-testid={`pie-boundary-handle-${boundaryHandle.receiverId}-${boundaryHandle.donorId}`}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
      onPointerDown={e => {
        e.stopPropagation();
        onBoundaryPointerDown(boundaryHandle, e);
      }}>
      <rect x={hitX} y={-hitWidth / 2} width={hitW} height={hitWidth} fill="transparent" />
      {showIndicator && <rect x={hitX} y={-indicatorWidth / 2} width={hitW} height={indicatorWidth} fill="oklch(0 0 0 / 0.35)" pointerEvents="none" />}
    </g>
  );
}

// Pick a resize cursor based on the slice boundary's screen orientation. CSS
// XY-resize cursors describe the drag direction, which is perpendicular to the
// line: a horizontal line is dragged vertically (ns-resize), a backslash line
// (NW-SE) is dragged along NE-SW (nesw-resize), etc. Line orientation θ ∈ [0, π)
// is bucketed into four π/4-wide bins centered on 0, π/4, π/2, 3π/4.
function pickResizeCursor(angle: number): string {
  let theta = angle % Math.PI;
  if (theta < 0) theta += Math.PI;
  const bucket = Math.round(theta / (Math.PI / 4)) % 4;
  return (['ns-resize', 'nesw-resize', 'ew-resize', 'nwse-resize'] as const)[bucket];
}
