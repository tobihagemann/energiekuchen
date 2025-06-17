export interface Activity {
  id: string;
  name: string;
  value: number; // 1-9 energy level
}

interface EnergyChart {
  activities: Activity[];
}

export interface EnergyPie {
  version: string;
  positive: EnergyChart;
  negative: EnergyChart;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
