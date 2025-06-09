export const BREAKPOINTS = {
  mobile: '320px',
  tablet: '768px',
  desktop: '1024px',
  wide: '1440px',
} as const;

export const RESPONSIVE_CHART_SIZES = {
  mobile: {
    small: 200,
    medium: 250,
    large: 300,
  },
  tablet: {
    small: 250,
    medium: 300,
    large: 350,
  },
  desktop: {
    small: 300,
    medium: 400,
    large: 500,
  },
} as const;

export const TOUCH_TARGET_SIZE = '44px';

// Energy level to color mapping using oklch values from color palette
// Level 1 (lowest) to Level 9 (highest)
export const ENERGY_LEVEL_COLORS = {
  positive: [
    'oklch(0.962 0.044 156.743)', // green-100
    'oklch(0.925 0.084 155.995)', // green-200
    'oklch(0.871 0.15 154.449)', // green-300
    'oklch(0.792 0.209 151.711)', // green-400
    'oklch(0.723 0.219 149.579)', // green-500
    'oklch(0.627 0.194 149.214)', // green-600
    'oklch(0.527 0.154 150.069)', // green-700
    'oklch(0.448 0.119 151.328)', // green-800
    'oklch(0.393 0.095 152.535)', // green-900
  ],
  negative: [
    'oklch(0.936 0.032 17.717)', // red-100
    'oklch(0.885 0.062 18.334)', // red-200
    'oklch(0.808 0.114 19.571)', // red-300
    'oklch(0.704 0.191 22.216)', // red-400
    'oklch(0.637 0.237 25.331)', // red-500
    'oklch(0.577 0.245 27.325)', // red-600
    'oklch(0.505 0.213 27.518)', // red-700
    'oklch(0.444 0.177 26.899)', // red-800
    'oklch(0.396 0.141 25.723)', // red-900
  ],
} as const;

export const CHART_DEFAULTS = {
  maxActivities: 20,
  minLevel: 1,
  maxLevel: 9,
  defaultLevel: 5,
  defaultSize: 'medium' as const,
  animationDuration: 300,
} as const;

// Helper function to get color for energy level
export function getColorForLevel(level: number, type: 'positive' | 'negative'): string {
  const clampedLevel = Math.max(1, Math.min(9, level));
  return ENERGY_LEVEL_COLORS[type][clampedLevel - 1];
}

export const STORAGE_KEY = 'energiekuchen-data';
export const MAX_URL_LENGTH = 2000;
