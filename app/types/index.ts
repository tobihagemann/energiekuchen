export interface Activity {
  id: string;
  name: string;
  value: number; // 1-9 energy level
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface EnergyChart {
  id: string;
  type: 'positive' | 'negative';
  activities: Activity[];
  size: ChartSize;
  title?: string;
}

export interface EnergyKuchen {
  version: string;
  lastModified: string;
  positive: EnergyChart;
  negative: EnergyChart;
}

export type ChartSize = 'small' | 'medium' | 'large';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
