'use client';

import { ArrowRightEndOnRectangleIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { PieLabel } from '@/app/components/charts/PieLabel';
import { PieSlice } from '@/app/components/charts/PieSlice';
import { Button } from '@/app/components/ui/Button';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { useAnimatedLabelOffsets, useAnimatedWeights } from '@/app/lib/hooks/useAnimatedWeights';
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
  const energy = useEnergy();
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

  const renderedEntries = useMemo<RenderedEntry[]>(
    () => [...activities.filter(a => a.polarity === 'positive'), ...activities.filter(a => a.polarity === 'negative')],
    [activities]
  );

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
    setActivityWeights: energy.setActivityWeights,
    setLabelOffset: energy.setLabelOffset,
    readOnly,
  });

  const targetWeights = useMemo(() => renderedEntries.map(e => drag.liveBoundaryWeights?.[e.id] ?? e.weight), [renderedEntries, drag.liveBoundaryWeights]);
  const displayedWeights = useAnimatedWeights(targetWeights, { bypass: !!drag.draggingBoundary });

  const targetOffsets = useMemo(() => renderedEntries.map(e => drag.liveLabelOffset?.[e.id] ?? e.labelOffset), [renderedEntries, drag.liveLabelOffset]);
  const displayedOffsets = useAnimatedLabelOffsets(targetOffsets, { bypass: !!drag.draggingLabel });

  const { slices, labels, layout, isEmpty } = useChartData({
    renderedEntries,
    displayedWeights,
    displayedOffsets,
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

  const hasCurrentActivities = energy.state.data.current.activities.length > 0;
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
            const nextIndex = (i + 1) % renderedEntries.length;
            const receiver = renderedEntries[i];
            const donor = renderedEntries[nextIndex];
            const boundaryHandle: BoundaryHandle | null =
              renderedEntries.length >= 2 && receiver && donor
                ? {
                    receiverId: receiver.id,
                    donorId: donor.id,
                    receiverIndex: i,
                    donorIndex: nextIndex,
                  }
                : null;
            const pct = getPercentage(slice.displayedWeight, total || 1);
            const sliceAriaLabel = `${slice.name}, ${pct} %, ${polarityLabel(slice.polarity)}`;
            const entry = renderedEntries[i];
            return (
              <PieSlice
                key={slice.id}
                slice={slice}
                cx={layout.cx}
                cy={layout.cy}
                radius={layout.radius}
                index={i}
                renderedEntries={renderedEntries}
                chartType={chartType}
                total={total || 1}
                boundaryHandle={boundaryHandle}
                isCoarsePointer={isCoarsePointer}
                readOnly={readOnly}
                ariaLabel={sliceAriaLabel}
                currentLabelOffset={entry?.labelOffset}
                onActivityClick={onActivityClick}
                onBoundaryPointerDown={drag.onBoundaryPointerDown}
                setActivityWeights={energy.setActivityWeights}
                setLabelOffset={energy.setLabelOffset}
                onAnnounce={announce}
              />
            );
          })}

          {!isEmpty &&
            labels.map((label, i) => (
              <PieLabel
                key={label.id}
                label={label}
                radius={layout.radius}
                fontSize={fontSize}
                detailsFontSize={detailsFontSize}
                initialOffset={renderedEntries[i]?.labelOffset}
                readOnly={readOnly}
                onLabelPointerDown={drag.onLabelPointerDown}
                onBBoxChange={onBBoxChange}
              />
            ))}
        </svg>

        {showCenterButton && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <Button
              onClick={energy.copyActivitiesFromCurrent}
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
