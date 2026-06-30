import { LabelOffset } from '@/app/types';

export const BREAKPOINTS = {
  small: 640,
  medium: 1280,
} as const;

// The materialized "no offset" label position. Persistence elides it (storage.ts) and the
// chart treats it as identical to an absent offset, so the shared value can be reused as the
// default anywhere an offset is read or initialized.
export const DEFAULT_LABEL_OFFSET: LabelOffset = { radial: 0, angular: 0 };

// Polarity color anchors using oklch values from the color palette; both equal the mid-band
// (green-500 / red-500) shade, i.e. getShadeColor(polarity, 0.5).
export const POSITIVE_COLOR = 'oklch(0.723 0.219 149.579)';
export const NEGATIVE_COLOR = 'oklch(0.637 0.237 25.331)';

// Outside-label text and leader-line colors. Shared by the live foreignObject labels
// (PieLabel) and the native-text export renderer (ChartExportSvg) so both stay in sync.
export const OUTSIDE_TEXT_COLOR = 'oklch(0.21 0.034 264.665)'; // gray-900
export const LEADER_LINE_COLOR = 'oklch(0.872 0.01 258.338)'; // gray-300

export const STORAGE_KEY = 'energiekuchen-data';
export const MAX_URL_LENGTH = 2000;
