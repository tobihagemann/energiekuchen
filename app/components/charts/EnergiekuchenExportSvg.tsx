'use client';

import { forwardRef, useCallback, useEffect, useMemo, useRef } from 'react';

import { ChartExportSvg, EXPORT_FONT_FAMILY, EXPORT_TITLE_HEIGHT } from '@/app/components/charts/ChartExportSvg';
import { EXPORT_LOGO_DATA_URI } from '@/app/components/charts/exportLogo';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { OUTSIDE_TEXT_COLOR } from '@/app/lib/utils/constants';
import { activityLayoutKey, formatExportDate } from '@/app/lib/utils/imageExport';
import type { ChartType } from '@/app/types';

const EXPORT_PADDING = 24;
const CHART_SIZE = 400;
const CHART_GAP = 32;
const FOOTER_HEIGHT = 76;
const FOOTER_FONT_SIZE = 16;
const FOOTER_META_FONT_SIZE = 13;
const FOOTER_LOGO_SIZE = 24;
const FOOTER_LOGO_GAP = 8;
// Rough glyph-advance estimate, only used to center the logo+wordmark block horizontally; the
// logo→text spacing itself is exact, so a slight off-center from a long date is harmless.
const FOOTER_CHAR_WIDTH_RATIO = 0.55;
const GRAY_600 = 'oklch(0.446 0.03 256.802)';

const CHART_BOX_HEIGHT = EXPORT_TITLE_HEIGHT + CHART_SIZE;
const WIDTH = EXPORT_PADDING * 2 + CHART_SIZE * 2 + CHART_GAP;
const HEIGHT = EXPORT_PADDING * 2 + CHART_BOX_HEIGHT + FOOTER_HEIGHT;

interface EnergiekuchenExportSvgProps {
  // Fired once both child charts have committed their measured layout.
  onReady?: () => void;
}

// Composes the Ist-Zustand and Wunsch-Zustand charts plus a wordmark/date footer into ONE
// standalone <svg> with intrinsic width/height for rasterization. Holds no external references
// (the wordmark is <text>, all paints inline) so the serialized SVG rasterizes without tainting
// the canvas. Forwards a ref to the root <svg> for serialization.
export const EnergiekuchenExportSvg = forwardRef<SVGSVGElement, EnergiekuchenExportSvgProps>(function EnergiekuchenExportSvg({ onReady }, ref) {
  const { state } = useEnergy();
  const current = state.data.current.activities;
  const desired = state.data.desired.activities;

  const exportDate = useMemo(() => formatExportDate(), []);

  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;
  const readyRef = useRef<Record<ChartType, boolean>>({ current: false, desired: false });
  const firedRef = useRef(false);

  // Reset readiness only when the data actually changes — never on mount, where it would wipe a
  // label-less child's immediately-fired ready signal before its sibling has measured (the
  // one-empty/one-populated case), permanently stalling the aggregate.
  const dataKey = useMemo(() => `${activityLayoutKey(current)}|${activityLayoutKey(desired)}`, [current, desired]);
  const prevDataKeyRef = useRef(dataKey);
  useEffect(() => {
    if (prevDataKeyRef.current === dataKey) return;
    prevDataKeyRef.current = dataKey;
    readyRef.current = { current: false, desired: false };
    firedRef.current = false;
  }, [dataKey]);

  const handleChildReady = useCallback((which: ChartType) => {
    readyRef.current[which] = true;
    if (readyRef.current.current && readyRef.current.desired && !firedRef.current) {
      firedRef.current = true;
      onReadyRef.current?.();
    }
  }, []);

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: '100%', height: 'auto', maxWidth: WIDTH, display: 'block' }}
      data-testid="energiekuchen-export-svg">
      <rect x={0} y={0} width={WIDTH} height={HEIGHT} fill="oklch(1 0 0)" />
      <g transform={`translate(${EXPORT_PADDING}, ${EXPORT_PADDING})`}>
        <ChartExportSvg activities={current} chartType="current" size={CHART_SIZE} title="📍 Ist-Zustand" onReady={() => handleChildReady('current')} />
      </g>
      <g transform={`translate(${EXPORT_PADDING + CHART_SIZE + CHART_GAP}, ${EXPORT_PADDING})`}>
        <ChartExportSvg activities={desired} chartType="desired" size={CHART_SIZE} title="🎯 Wunsch-Zustand" onReady={() => handleChildReady('desired')} />
      </g>
      {(() => {
        const footerTop = EXPORT_PADDING + CHART_BOX_HEIGHT;
        const brandRowY = footerTop + 26;
        const metaRowY = footerTop + 54;
        const estWordmarkWidth = 'Energiekuchen'.length * FOOTER_FONT_SIZE * FOOTER_CHAR_WIDTH_RATIO;
        const brandStartX = (WIDTH - (FOOTER_LOGO_SIZE + FOOTER_LOGO_GAP + estWordmarkWidth)) / 2;
        return (
          <>
            <image href={EXPORT_LOGO_DATA_URI} x={brandStartX} y={brandRowY - FOOTER_LOGO_SIZE / 2} width={FOOTER_LOGO_SIZE} height={FOOTER_LOGO_SIZE} />
            <text
              x={brandStartX + FOOTER_LOGO_SIZE + FOOTER_LOGO_GAP}
              y={brandRowY}
              textAnchor="start"
              dominantBaseline="central"
              fontFamily={EXPORT_FONT_FAMILY}
              fontSize={FOOTER_FONT_SIZE}
              fontWeight="bold"
              fill={OUTSIDE_TEXT_COLOR}>
              Energiekuchen
            </text>
            <text
              x={WIDTH / 2}
              y={metaRowY}
              textAnchor="middle"
              dominantBaseline="central"
              fontFamily={EXPORT_FONT_FAMILY}
              fontSize={FOOTER_META_FONT_SIZE}
              fill={GRAY_600}>
              {`energiekuchen.de · ${exportDate}`}
            </text>
          </>
        );
      })()}
    </svg>
  );
});
