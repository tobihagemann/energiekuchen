import { EnergyPie } from '@/app/types';
import { STORAGE_KEY } from './constants';
import { validateActivityValue } from './validation';

export class StorageManager {
  static save(data: EnergyPie): void {
    try {
      const serialized = JSON.stringify(data);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (error) {
      console.error('Failed to save data to localStorage:', error);
      throw new Error('Daten konnten nicht gespeichert werden');
    }
  }

  static load(): EnergyPie | null {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) {
        return null;
      }

      // Use the same validation logic as import
      try {
        const validated = importData(serialized);
        return validated;
      } catch (validationError) {
        console.error('Validation failed when loading from localStorage:', validationError);
        // Clear invalid data from localStorage
        this.clear();
        return null;
      }
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

  static import(jsonString: string): EnergyPie {
    return importData(jsonString);
  }
}

// Standalone export/import functions for use in components
export function exportData(data: EnergyPie): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): EnergyPie {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(jsonString) as any;

    // Check for old version format (v1.0 with positive/negative) and reject it
    if (data.positive || data.negative) {
      throw new Error('Alte Datenformat-Version (v1.0) wird nicht mehr unterstützt.');
    }

    // Basic validation - we need at least current or desired data
    if (!data.current && !data.desired) {
      throw new Error('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');
    }

    // Validate activities have required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validateActivities = (activities: any[]): any[] => {
      if (!Array.isArray(activities)) return [];

      return activities
        .map(activity => {
          // Migration: Remove color and timestamp properties if they exist
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { color, createdAt, updatedAt, ...activityWithoutLegacyFields } = activity;

          return activityWithoutLegacyFields;
        })
        .filter(activity => {
          // Check required fields
          if (!activity.name || typeof activity.name !== 'string') {
            throw new Error('Aktivität muss einen Namen haben');
          }
          if (activity.value === undefined || typeof activity.value !== 'number') {
            throw new Error('Aktivität muss ein Energieniveau haben');
          }

          // Validate that value is within the allowed range
          const valueValidation = validateActivityValue(activity.value);
          if (!valueValidation.isValid) {
            throw new Error(valueValidation.errors[0]);
          }

          return true;
        });
    };

    // Validate and process activities
    const currentActivities = data.current?.activities ? validateActivities(data.current.activities) : [];
    const desiredActivities = data.desired?.activities ? validateActivities(data.desired.activities) : [];

    // Create a complete data structure with defaults
    const result: EnergyPie = {
      version: data.version || '2.0',
      current: {
        activities: currentActivities,
      },
      desired: {
        activities: desiredActivities,
      },
    };

    return result;
  } catch (error) {
    console.error('Failed to import data:', error);
    if (
      error instanceof Error &&
      (error.message.includes('Aktivität') || error.message.includes('Energieniveau') || error.message.includes('Alte Datenformat'))
    ) {
      throw error; // Re-throw validation errors with specific messages
    }
    throw new Error('Ungültige Datei oder Datenformat');
  }
}
