'use client';

import { useCallback, useRef, useState } from 'react';

import { getFloor } from '@/app/lib/utils/floor';
import { applyLabelOffset, isInSnapZone, LABEL_DEFAULT_RADIUS_FRACTION } from '@/app/lib/utils/labelLayout';
import { cartesianToPolar, clientToSvgPoint, normalizeAngle } from '@/app/lib/utils/polar';
import { redistributeTwoDonor, type WeightEntry } from '@/app/lib/utils/redistribution';
import { validateLabelOffset } from '@/app/lib/utils/validation';
import type { ChartType, LabelOffset } from '@/app/types';

export interface BoundaryHandle {
  receiverId: string;
  donorId: string;
  receiverIndex: number;
  donorIndex: number;
}

export interface LabelHandle {
  activityId: string;
  midAngle: number;
  radius: number;
  initialOffset?: LabelOffset;
}

interface UsePieDragOptions {
  svgRef: React.RefObject<SVGSVGElement | null>;
  center: { cx: number; cy: number };
  total: number;
  chartType: ChartType;
  renderedEntries: WeightEntry[];
  setActivityWeights: (chartType: ChartType, entries: WeightEntry[]) => void;
  setLabelOffset: (chartType: ChartType, activityId: string, offset: LabelOffset | null) => void;
  readOnly?: boolean;
}

export interface UsePieDragResult {
  onBoundaryPointerDown: (handle: BoundaryHandle, e: React.PointerEvent) => void;
  onLabelPointerDown: (handle: LabelHandle, e: React.PointerEvent) => void;
  draggingBoundary: BoundaryHandle | null;
  draggingLabel: LabelHandle | null;
  liveBoundaryWeights: Record<string, number> | null;
  liveLabelOffset: Record<string, LabelOffset> | null;
}

export function usePieDrag(opts: UsePieDragOptions): UsePieDragResult {
  const { svgRef, center, total, chartType, renderedEntries, setActivityWeights, setLabelOffset, readOnly = false } = opts;
  const [draggingBoundary, setDraggingBoundary] = useState<BoundaryHandle | null>(null);
  const [draggingLabel, setDraggingLabel] = useState<LabelHandle | null>(null);
  const [liveBoundaryWeights, setLiveBoundaryWeights] = useState<Record<string, number> | null>(null);
  const [liveLabelOffset, setLiveLabelOffset] = useState<Record<string, LabelOffset> | null>(null);

  const boundaryStateRef = useRef<{
    handle: BoundaryHandle;
    pointerId: number;
    prevAngle: number;
    cumulativeTheta: number;
    startReceiver: number;
    startDonor: number;
    deltaWeight: number;
  } | null>(null);

  const labelStateRef = useRef<{
    handle: LabelHandle;
    pointerId: number;
    offset: LabelOffset;
  } | null>(null);

  const onBoundaryPointerDown = useCallback(
    (handle: BoundaryHandle, e: React.PointerEvent) => {
      if (readOnly || !svgRef.current) return;
      e.stopPropagation();
      const svg = svgRef.current;
      const svgPoint = clientToSvgPoint(svg, e.clientX, e.clientY);
      const polar = cartesianToPolar(center.cx, center.cy, svgPoint.x, svgPoint.y);
      const receiverWeight = renderedEntries[handle.receiverIndex]?.weight ?? 0;
      const donorWeight = renderedEntries[handle.donorIndex]?.weight ?? 0;

      boundaryStateRef.current = {
        handle,
        pointerId: e.pointerId,
        prevAngle: polar.angle,
        cumulativeTheta: 0,
        startReceiver: receiverWeight,
        startDonor: donorWeight,
        deltaWeight: 0,
      };
      setDraggingBoundary(handle);
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {
        // pointer capture is best-effort
      }

      const floor = getFloor(total);

      const handleMove = (moveEvent: PointerEvent) => {
        const state = boundaryStateRef.current;
        if (!state || !svgRef.current) return;
        if (moveEvent.pointerId !== state.pointerId) return;
        const movePoint = clientToSvgPoint(svgRef.current, moveEvent.clientX, moveEvent.clientY);
        const movePolar = cartesianToPolar(center.cx, center.cy, movePoint.x, movePoint.y);
        // Integrate small per-step deltas instead of diffing against the start angle:
        // a one-shot diff wraps at ±π and flips the receiver/donor roles when the
        // pointer crosses the start's antipode. Clamping the cumulative theta in radians
        // mirrors the weight clamp and stays responsive when the user drags back.
        const maxIncrease = state.startDonor - floor;
        const maxDecrease = state.startReceiver - floor;
        const maxIncreaseTheta = (maxIncrease / total) * Math.PI * 2;
        const maxDecreaseTheta = (maxDecrease / total) * Math.PI * 2;
        const step = normalizeAngle(movePolar.angle - state.prevAngle);
        state.prevAngle = movePolar.angle;
        state.cumulativeTheta = Math.max(-maxDecreaseTheta, Math.min(maxIncreaseTheta, state.cumulativeTheta + step));
        let deltaWeight = (state.cumulativeTheta / (Math.PI * 2)) * total;
        if (deltaWeight > maxIncrease) deltaWeight = maxIncrease;
        if (deltaWeight < -maxDecrease) deltaWeight = -maxDecrease;
        state.deltaWeight = deltaWeight;
        setLiveBoundaryWeights({
          [state.handle.receiverId]: state.startReceiver + deltaWeight,
          [state.handle.donorId]: state.startDonor - deltaWeight,
        });
      };

      const handleUp = (upEvent: PointerEvent) => {
        const state = boundaryStateRef.current;
        if (state && upEvent.pointerId !== state.pointerId) return;
        boundaryStateRef.current = null;
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointercancel', handleUp);
        setDraggingBoundary(null);
        setLiveBoundaryWeights(null);
        if (!state) return;

        const { handle: h, deltaWeight } = state;
        if (deltaWeight === 0) return;

        let receiverIndex = h.receiverIndex;
        let donorIndex = h.donorIndex;
        let absDelta = deltaWeight;
        if (deltaWeight < 0) {
          receiverIndex = h.donorIndex;
          donorIndex = h.receiverIndex;
          absDelta = -deltaWeight;
        }
        const committed = redistributeTwoDonor(renderedEntries, receiverIndex, donorIndex, absDelta, floor);
        const changed: WeightEntry[] = [
          { id: committed[receiverIndex].id, weight: committed[receiverIndex].weight },
          { id: committed[donorIndex].id, weight: committed[donorIndex].weight },
        ];
        setActivityWeights(chartType, changed);
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
      document.addEventListener('pointercancel', handleUp);
    },
    [center, chartType, readOnly, renderedEntries, setActivityWeights, svgRef, total]
  );

  const onLabelPointerDown = useCallback(
    (handle: LabelHandle, e: React.PointerEvent) => {
      if (readOnly || !svgRef.current) return;
      e.stopPropagation();
      labelStateRef.current = {
        handle,
        pointerId: e.pointerId,
        offset: handle.initialOffset ?? { radial: 0, angular: 0 },
      };
      setDraggingLabel(handle);
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {
        // best-effort
      }

      const handleMove = (moveEvent: PointerEvent) => {
        const state = labelStateRef.current;
        if (!state || !svgRef.current) return;
        if (moveEvent.pointerId !== state.pointerId) return;
        const svgPoint = clientToSvgPoint(svgRef.current, moveEvent.clientX, moveEvent.clientY);
        const polar = cartesianToPolar(center.cx, center.cy, svgPoint.x, svgPoint.y);
        const offset: LabelOffset = {
          radial: polar.r / state.handle.radius - LABEL_DEFAULT_RADIUS_FRACTION,
          angular: normalizeAngle(polar.angle - state.handle.midAngle),
        };
        state.offset = offset;
        setLiveLabelOffset({ [state.handle.activityId]: offset });
      };

      const handleUp = (upEvent: PointerEvent) => {
        const state = labelStateRef.current;
        if (state && upEvent.pointerId !== state.pointerId) return;
        labelStateRef.current = null;
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
        document.removeEventListener('pointercancel', handleUp);
        setDraggingLabel(null);
        setLiveLabelOffset(null);
        if (!state) return;

        const validation = validateLabelOffset(state.offset);
        if (!validation.isValid || !validation.normalized) return;

        const clampedPos = applyLabelOffset({ cx: center.cx, cy: center.cy, midAngle: state.handle.midAngle }, validation.normalized, state.handle.radius);
        const defaultPos = applyLabelOffset({ cx: center.cx, cy: center.cy, midAngle: state.handle.midAngle }, undefined, state.handle.radius);
        if (isInSnapZone(clampedPos, defaultPos, state.handle.radius)) {
          setLabelOffset(chartType, state.handle.activityId, null);
        } else {
          setLabelOffset(chartType, state.handle.activityId, validation.normalized);
        }
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
      document.addEventListener('pointercancel', handleUp);
    },
    [center, chartType, readOnly, setLabelOffset, svgRef]
  );

  return {
    onBoundaryPointerDown,
    onLabelPointerDown,
    draggingBoundary,
    draggingLabel,
    liveBoundaryWeights,
    liveLabelOffset,
  };
}
