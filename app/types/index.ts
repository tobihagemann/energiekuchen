export interface Activity {
  id: string;
  name: string;
  value: number; // -5 to +5 energy level (excluding 0)
}

interface EnergyChart {
  activities: Activity[];
}

export interface EnergyPie {
  version: string;
  current: EnergyChart;
  desired: EnergyChart;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Re-export ChartType for convenience
export type { ChartType } from './context';
