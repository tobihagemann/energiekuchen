export const BREAKPOINTS = {
  small: 640,
  medium: 1280,
} as const;

// Energy level to color mapping using oklch values from color palette
// Level 1 (lowest) to Level 5 (highest)
const ENERGY_LEVEL_COLORS = {
  positive: [
    'oklch(0.871 0.15 154.449)', // green-300
    'oklch(0.792 0.209 151.711)', // green-400
    'oklch(0.723 0.219 149.579)', // green-500
    'oklch(0.627 0.194 149.214)', // green-600
    'oklch(0.527 0.154 150.069)', // green-700
  ],
  negative: [
    'oklch(0.808 0.114 19.571)', // red-300
    'oklch(0.704 0.191 22.216)', // red-400
    'oklch(0.637 0.237 25.331)', // red-500
    'oklch(0.577 0.245 27.325)', // red-600
    'oklch(0.505 0.213 27.518)', // red-700
  ],
} as const;

// Helper function to get color for energy level
// Positive values (1-5) use green colors, negative values (-1 to -5) use red colors
export function getColorForLevel(level: number): string {
  const absLevel = Math.abs(level);
  const clampedLevel = Math.max(1, Math.min(5, absLevel));
  const type = level > 0 ? 'positive' : 'negative';
  return ENERGY_LEVEL_COLORS[type][clampedLevel - 1];
}

export const STORAGE_KEY = 'energiekuchen-data';
export const MAX_URL_LENGTH = 2000;
