export interface Activity {
  id: string;
  name: string;
  value: number; // 1-9 energy level
  createdAt: string;
  updatedAt: string;
}

interface EnergyChart {
  id: string;
  type: 'positive' | 'negative';
  activities: Activity[];
  title?: string;
}

export interface EnergyKuchen {
  version: string;
  lastModified: string;
  positive: EnergyChart;
  negative: EnergyChart;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
