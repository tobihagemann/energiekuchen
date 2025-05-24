export interface Activity {
  id: string;
  name: string;
  value: number; // 1-100
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
  settings: AppSettings;
}

export interface AppSettings {
  chartSize: ChartSize;
  colorScheme: ColorScheme;
  showTooltips: boolean;
  showLegends: boolean;
  language: 'de';
}

export type ChartSize = 'small' | 'medium' | 'large';
export type ColorScheme = 'default' | 'high-contrast' | 'colorblind-friendly';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
