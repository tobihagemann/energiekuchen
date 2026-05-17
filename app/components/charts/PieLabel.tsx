'use client';

import { useEffect, useRef } from 'react';

import type { LabelGeometry } from '@/app/lib/hooks/useChartData';
import type { LabelHandle } from '@/app/lib/hooks/usePieDrag';
import type { LabelOffset } from '@/app/types';

interface PieLabelProps {
  label: LabelGeometry;
  radius: number;
  fontSize: number;
  detailsFontSize: number;
  initialOffset: LabelOffset | undefined;
  readOnly: boolean;
  onLabelPointerDown: (handle: LabelHandle, e: React.PointerEvent) => void;
  onBBoxChange: (id: string, bbox: { w: number; h: number }) => void;
}

export function PieLabel({ label, radius, fontSize, detailsFontSize, initialOffset, readOnly, onLabelPointerDown, onBBoxChange }: PieLabelProps) {
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const report = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width && rect.height) {
        onBBoxChange(label.id, { w: rect.width, h: rect.height });
      }
    };
    report();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(report);
      observer.observe(el);
      return () => observer.disconnect();
    }
  }, [label.id, label.name, label.details, onBBoxChange]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (readOnly) return;
    onLabelPointerDown(
      {
        activityId: label.id,
        midAngle: label.midAngle,
        radius,
        initialOffset,
      },
      e
    );
  };

  const width = 140;
  const height = 60;

  return (
    <g data-testid={`pie-label-${label.id}`}>
      {label.leaderTo && (
        <line x1={label.leaderTo.x} y1={label.leaderTo.y} x2={label.x} y2={label.y} stroke="oklch(0.872 0.01 258.338)" strokeWidth={1} pointerEvents="none" />
      )}
      <foreignObject x={label.x - width / 2} y={label.y - height / 2} width={width} height={height} pointerEvents={readOnly ? 'none' : 'auto'}>
        <div
          ref={measureRef}
          onPointerDown={handlePointerDown}
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            color: 'oklch(1 0 0)',
            fontWeight: 'bold',
            fontSize: `${fontSize}px`,
            lineHeight: 1.1,
            textAlign: 'center',
            cursor: readOnly ? 'default' : 'grab',
            userSelect: 'none',
            touchAction: 'none',
            padding: '2px 4px',
          }}>
          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{label.name}</span>
          {label.details && (
            <span
              style={{ fontSize: `${detailsFontSize}px`, fontWeight: 'normal', whiteSpace: 'pre-wrap', maxWidth: '100%', overflow: 'hidden' }}
              data-testid={`pie-label-details-${label.id}`}>
              {label.details}
            </span>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
