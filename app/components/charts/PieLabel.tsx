'use client';

import { useEffect, useRef, useState } from 'react';

import type { LabelGeometry } from '@/app/lib/hooks/useChartData';
import type { LabelHandle } from '@/app/lib/hooks/usePieDrag';
import type { LabelOffset } from '@/app/types';

const OUTSIDE_TEXT_COLOR = 'oklch(0.21 0.034 264.665)'; // gray-900
const LEADER_LINE_COLOR = 'oklch(0.872 0.01 258.338)'; // gray-300

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
  const [isHovered, setIsHovered] = useState(false);

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

  // Generous viewport so wrapped multi-line text isn't clipped. The bbox we report to the
  // layout engine is the measured content size, not this viewport size, so making it
  // larger doesn't expand the collision region.
  const width = 200;
  const height = 120;

  return (
    <g data-testid={`pie-label-${label.id}`}>
      {label.leaderTo && label.leaderFrom && (
        <line
          x1={label.leaderFrom.x}
          y1={label.leaderFrom.y}
          x2={label.leaderTo.x}
          y2={label.leaderTo.y}
          stroke={LEADER_LINE_COLOR}
          strokeWidth={1}
          pointerEvents="none"
        />
      )}
      <foreignObject x={label.x - width / 2} y={label.y - height / 2} width={width} height={height} pointerEvents="none">
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
          <div
            ref={measureRef}
            onPointerDown={handlePointerDown}
            onPointerEnter={() => {
              if (!readOnly) setIsHovered(true);
            }}
            onPointerLeave={() => setIsHovered(false)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              color: label.isOutside ? OUTSIDE_TEXT_COLOR : label.insideTextColor,
              fontWeight: 'bold',
              fontSize: `${fontSize}px`,
              lineHeight: 1.1,
              textAlign: 'center',
              cursor: readOnly ? 'default' : 'grab',
              userSelect: 'none',
              touchAction: 'none',
              padding: '2px 4px',
              maxWidth: '100%',
              maxHeight: '100%',
              pointerEvents: readOnly ? 'none' : 'auto',
              // Subtle hover affordance mirroring the boundary handle's hover indicator.
              // outline (vs border) doesn't affect layout/bbox measurement.
              outline: isHovered && !readOnly ? '1px dashed oklch(0 0 0 / 0.35)' : 'none',
              outlineOffset: '2px',
            }}>
            <span style={{ overflowWrap: 'break-word', maxWidth: '100%' }}>{label.name}</span>
            {label.details && (
              <span
                style={{ fontSize: `${detailsFontSize}px`, fontWeight: 'normal', whiteSpace: 'pre-wrap', maxWidth: '100%', overflow: 'hidden' }}
                data-testid={`pie-label-details-${label.id}`}>
                {label.details}
              </span>
            )}
          </div>
        </div>
      </foreignObject>
    </g>
  );
}
