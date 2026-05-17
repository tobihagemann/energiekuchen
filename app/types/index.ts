export type Polarity = 'positive' | 'negative';

export interface LabelOffset {
  radial: number; // additive offset on the radius axis, in pie-radius units
  angular: number; // additive offset on the angular axis, in radians
}

export interface Activity {
  id: string;
  name: string;
  weight: number; // > 0, persisted to 2 decimals
  polarity: Polarity;
  details?: string; // Optional details text (max 150 chars)
  labelOffset?: LabelOffset;
}

interface EnergyChart {
  activities: Activity[];
}

export interface EnergyPie {
  version: '3.0';
  current: EnergyChart;
  desired: EnergyChart;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Re-export ChartType for convenience
export type { ChartType } from './context';
