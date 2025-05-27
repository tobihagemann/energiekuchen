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

export const COLOR_PALETTES = {
  positive: ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#D1FAE5', '#059669', '#047857', '#065F46', '#064E3B', '#022C22'],
  negative: ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#FEE2E2', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D', '#450A0A'],
} as const;

export const CHART_DEFAULTS = {
  maxActivities: 20,
  minValue: 1,
  maxValue: 100,
  defaultValue: 10,
  defaultSize: 'medium' as const,
  animationDuration: 300,
} as const;

export const STORAGE_KEY = 'energiekuchen-data';
export const MAX_URL_LENGTH = 2000;
