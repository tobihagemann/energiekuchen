import { EnergyKuchen } from './index';

export interface StorageManager {
  save: (data: EnergyKuchen) => void;
  load: () => EnergyKuchen | null;
  clear: () => void;
  export: () => string;
  import: (data: string) => EnergyKuchen;
}

export interface ShareData {
  encoded: string;
  url: string;
}
