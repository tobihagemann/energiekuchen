import { Polarity } from '@/app/types';

export const BREAKPOINTS = {
  small: 640,
  medium: 1280,
} as const;

// Polarity color anchors using oklch values from the color palette.
// Both equal the level-3 mid-tones (green-500 / red-500) of the prior energy-level ramps.
export const POSITIVE_COLOR = 'oklch(0.723 0.219 149.579)';
export const NEGATIVE_COLOR = 'oklch(0.637 0.237 25.331)';

export function getColorForPolarity(polarity: Polarity): string {
  return polarity === 'positive' ? POSITIVE_COLOR : NEGATIVE_COLOR;
}

export const STORAGE_KEY = 'energiekuchen-data';
export const MAX_URL_LENGTH = 2000;
