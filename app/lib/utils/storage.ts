import { EnergyKuchen } from '@/app/types';
import { STORAGE_KEY } from './constants';

export class StorageManager {
  static save(data: EnergyKuchen): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      throw new Error('Daten konnten nicht gespeichert werden');
    }
  }

  static load(): EnergyKuchen | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return null;
      
      return JSON.parse(serialized) as EnergyKuchen;
    } catch (error) {
      console.error('Failed to load data from localStorage:', error);
      return null;
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  static export(): string {
    const data = this.load();
    if (!data) throw new Error('Keine Daten zum Exportieren vorhanden');
    
    return JSON.stringify(data, null, 2);
  }

  static import(jsonString: string): EnergyKuchen {
    try {
      const data = JSON.parse(jsonString) as EnergyKuchen;
      
      // Basic validation
      if (!data.version || !data.positive || !data.negative) {
        throw new Error('Ungültiges Datenformat');
      }
      
      return data;
    } catch (error) {
      console.error('Failed to import data:', error);
      throw new Error('Ungültige Datei oder Datenformat');
    }
  }
}

// Standalone export/import functions for use in components
export function exportData(data: EnergyKuchen): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): EnergyKuchen {
  try {
    const data = JSON.parse(jsonString) as EnergyKuchen;
    
    // Basic validation
    if (!data.version || !data.positive || !data.negative) {
      throw new Error('Ungültiges Datenformat');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to import data:', error);
    throw new Error('Ungültige Datei oder Datenformat');
  }
}
