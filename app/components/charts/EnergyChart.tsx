'use client';

import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PieLabel } from '@/app/components/charts/PieLabel';
import { BoundaryRect, PieSlice } from '@/app/components/charts/PieSlice';
import { Button } from '@/app/components/ui/Button';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { useAnimatedRenderedEntries } from '@/app/lib/hooks/useAnimatedRenderedEntries';
import { RenderedEntry, useChartData } from '@/app/lib/hooks/useChartData';
import { usePieDrag, type BoundaryHandle } from '@/app/lib/hooks/usePieDrag';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { cn } from '@/app/lib/utils/cn';
import { LabelBBox } from '@/app/lib/utils/labelLayout';
import { getPercentage } from '@/app/lib/utils/percentage';
import type { Activity, ChartType, Polarity } from '@/app/types';

interface EnergyChartProps {
  activities: Activity[];
  chartType: ChartType;
  className?: string;
  onActivityClick?: (activityId: string) => void;
  readOnly?: boolean;
}

const ANNOUNCE_DEBOUNCE_MS = 100;

function chartTypeLabel(chartType: ChartType): string {
  return chartType === 'current' ? 'Ist-Zustand' : 'Wunsch-Zustand';
}

function polarityLabel(polarity: Polarity): string {
  return polarity === 'positive' ? 'energiespendend' : 'energieraubend';
}

export function EnergyChart({ activities, chartType, className, onActivityClick, readOnly = false }: EnergyChartProps) {
  const { state: uiState } = useUI();
  const { state: energyState, setActivityWeights, setLabelOffset, copyActivitiesFromCurrent } = useEnergy();
  const { isSmall, isMedium } = useResponsive();
  const svgRef = useRef<SVGSVGElement>(null);
  const [labelBBoxes, setLabelBBoxes] = useState<Record<string, LabelBBox>>({});
  const [announcement, setAnnouncement] = useState('');
  const announceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingAnnounceRef = useRef<string | null>(null);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(pointer: coarse)');
    const update = () => setIsCoarsePointer(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Render in activities[] order verbatim so polarities may interleave around the ring
  // and the chart stays in sync with the activity list's order.
  const renderedEntries = useMemo<RenderedEntry[]>(() => [...activities], [activities]);

  const chartSize = isSmall ? 280 : isMedium ? 360 : 440;
  const fontSize = isSmall ? 12 : isMedium ? 14 : 16;
  const detailsFontSize = isSmall ? 10 : isMedium ? 11 : 12;

  const total = useMemo(() => renderedEntries.reduce((s, e) => s + e.weight, 0), [renderedEntries]);

  const drag = usePieDrag({
    svgRef,
    center: { cx: 0, cy: 0 },
    total: total || 1,
    chartType,
    renderedEntries,
    setActivityWeights,
    setLabelOffset,
    readOnly,
  });

  const targetEntries = useMemo<RenderedEntry[]>(
    () =>
      renderedEntries.map(e => ({
        ...e,
        weight: drag.liveBoundaryWeights?.[e.id] ?? e.weight,
        labelOffset: drag.liveLabelOffset?.[e.id] ?? e.labelOffset,
      })),
    [renderedEntries, drag.liveBoundaryWeights, drag.liveLabelOffset]
  );
  const animatedEntries = useAnimatedRenderedEntries(targetEntries, {
    bypass: !!drag.draggingBoundary || !!drag.draggingLabel,
  });

  const realIndexById = useMemo(() => {
    const map: Record<string, number> = {};
    renderedEntries.forEach((e, i) => {
      map[e.id] = i;
    });
    return map;
  }, [renderedEntries]);

  const { slices, labels, layout, isEmpty } = useChartData({
    renderedEntries: animatedEntries,
    draggedLabelId: drag.draggingLabel?.activityId ?? null,
    labelBBoxes,
    editingActivity: uiState.editingActivity,
    chartType,
    chartSize,
  });

  const announce = useCallback((message: string) => {
    pendingAnnounceRef.current = message;
    if (announceTimerRef.current) return;
    announceTimerRef.current = setTimeout(() => {
      if (pendingAnnounceRef.current) setAnnouncement(pendingAnnounceRef.current);
      pendingAnnounceRef.current = null;
      announceTimerRef.current = null;
    }, ANNOUNCE_DEBOUNCE_MS);
  }, []);

  useEffect(
    () => () => {
      if (announceTimerRef.current) clearTimeout(announceTimerRef.current);
    },
    []
  );

  const onBBoxChange = useCallback((id: string, bbox: LabelBBox) => {
    setLabelBBoxes(prev => (prev[id]?.w === bbox.w && prev[id]?.h === bbox.h ? prev : { ...prev, [id]: bbox }));
  }, []);

  const hasCurrentActivities = energyState.data.current.activities.length > 0;
  const showCenterButton = !readOnly && isEmpty && chartType === 'desired';

  const title = chartTypeLabel(chartType);
  const subtitle = chartType === 'current' ? 'Deine aktuelle Energiebilanz' : 'Deine gewünschte Energiebilanz';
  const icon = chartType === 'current' ? '📍' : '🎯';
  const ariaLabel = `Energiekuchen, ${title}`;

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="mb-4 text-center">
        <h2 className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-900">
          <span className="text-2xl">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="relative" style={{ maxWidth: layout.sizePx, width: '100%' }}>
        <svg
          ref={svgRef}
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- HTML <fieldset> is not valid inside an SVG; role="group" with aria-label is the WAI-ARIA recommendation for SVG containers
          role="group"
          aria-label={ariaLabel}
          viewBox={layout.viewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ width: '100%', maxWidth: `${layout.sizePx}px`, height: 'auto', display: 'block', touchAction: 'none' }}
          data-testid={`energy-chart-${chartType}`}>
          {slices.map((slice, i) => {
            if (isEmpty) {
              return <path key={slice.id} d={slice.pathD} fill={slice.fillColor} stroke={slice.borderColor} strokeWidth={2} />;
            }
            const animEntry = animatedEntries[i];
            // Ghost slices (deleted activities still shrinking out) render as a plain path
            // with no interactivity — there's no underlying activity to click, drag, or
            // bind a boundary handle to.
            if (animEntry?.isGhost) {
              return <path key={slice.id} d={slice.pathD} fill={slice.fillColor} stroke={slice.borderColor} strokeWidth={2} pointerEvents="none" />;
            }
            const receiverRealIndex = realIndexById[animEntry.id];
            // One-render window after a deletion: parent's `renderedEntries` has dropped
            // the entry but the animation hook hasn't marked it ghost yet. Skip rather
            // than pass `index={undefined}` to PieSlice (matches the boundary-handle
            // layer's symmetric guard below).
            if (receiverRealIndex === undefined) return null;
            const pct = getPercentage(slice.weight, total || 1);
            const sliceAriaLabel = `${slice.name}, ${pct} %, ${polarityLabel(slice.polarity)}`;
            return (
              <PieSlice
                key={slice.id}
                slice={slice}
                index={receiverRealIndex}
                renderedEntries={renderedEntries}
                chartType={chartType}
                total={total || 1}
                readOnly={readOnly}
                ariaLabel={sliceAriaLabel}
                currentLabelOffset={renderedEntries[receiverRealIndex]?.labelOffset}
                onActivityClick={onActivityClick}
                setActivityWeights={setActivityWeights}
                setLabelOffset={setLabelOffset}
                onAnnounce={announce}
              />
            );
          })}

          {/* Re-stroke the selected slice's outline above all fills so neighbors' white
              strokes don't overpaint the darker border on the shared radial edges. */}
          {!isEmpty &&
            uiState.editingActivity?.chartType === chartType &&
            (() => {
              const activeSlice = slices.find(s => s.id === uiState.editingActivity?.activityId);
              if (!activeSlice) return null;
              return (
                <path
                  d={activeSlice.pathD}
                  fill="none"
                  stroke={activeSlice.borderColor}
                  strokeWidth={2}
                  pointerEvents="none"
                  data-testid={`pie-slice-outline-${activeSlice.id}`}
                />
              );
            })()}

          {/* Boundary handles render in a separate layer above all slice paths so a
              neighboring slice's fill (drawn after the handle's "owner" slice) can't
              overpaint the half of the indicator that sits on the neighbor's side. */}
          {!isEmpty &&
            renderedEntries.length >= 2 &&
            slices.map((slice, i) => {
              const animEntry = animatedEntries[i];
              if (!animEntry || animEntry.isGhost) return null;
              let donorAnimIndex: number | null = null;
              for (let step = 1; step < animatedEntries.length; step++) {
                const candidate = animatedEntries[(i + step) % animatedEntries.length];
                if (candidate && !candidate.isGhost) {
                  donorAnimIndex = (i + step) % animatedEntries.length;
                  break;
                }
              }
              const donor = donorAnimIndex !== null ? animatedEntries[donorAnimIndex] : null;
              const receiverRealIndex = realIndexById[animEntry.id];
              const donorRealIndex = donor ? realIndexById[donor.id] : -1;
              if (!donor || receiverRealIndex === undefined || donorRealIndex === -1 || receiverRealIndex === donorRealIndex) return null;
              const handle: BoundaryHandle = {
                receiverId: animEntry.id,
                donorId: donor.id,
                receiverIndex: receiverRealIndex,
                donorIndex: donorRealIndex,
              };
              return (
                <BoundaryRect
                  key={`boundary-${slice.id}`}
                  cx={layout.cx}
                  cy={layout.cy}
                  radius={layout.radius}
                  angle={slice.endAngle}
                  boundaryHandle={handle}
                  isCoarsePointer={isCoarsePointer}
                  readOnly={readOnly}
                  onBoundaryPointerDown={drag.onBoundaryPointerDown}
                />
              );
            })}

          {!isEmpty &&
            labels.map(label => {
              const realIdx = realIndexById[label.id];
              // Skip labels for ghost entries — they belong to deleted activities.
              if (realIdx === undefined) return null;
              return (
                <PieLabel
                  key={label.id}
                  label={label}
                  radius={layout.radius}
                  fontSize={fontSize}
                  detailsFontSize={detailsFontSize}
                  initialOffset={renderedEntries[realIdx]?.labelOffset}
                  readOnly={readOnly}
                  onLabelPointerDown={drag.onLabelPointerDown}
                  onBBoxChange={onBBoxChange}
                />
              );
            })}
        </svg>

        {showCenterButton && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Button
              onClick={copyActivitiesFromCurrent}
              disabled={!hasCurrentActivities}
              className="pointer-events-auto gap-2 ring-4 ring-white"
              data-testid="copy-from-current-chart-button">
              <ArrowRightEndOnRectangleIcon className="h-4 w-4" />
              Ist-Zustand übernehmen
            </Button>
          </div>
        )}
      </div>

      <div role="alert" aria-live="polite" className="sr-only" data-testid={`chart-announcer-${chartType}`}>
        {announcement}
      </div>
    </div>
  );
}
