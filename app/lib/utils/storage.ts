import { EnergyKuchen } from '@/app/types';
import { STORAGE_KEY } from './constants';
import { validateActivityValue } from './validation';

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
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized) as EnergyKuchen;

      // Migration: Remove color property from activities if it exists
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const migrateActivities = (activities: any[]): any[] => {
        return activities.map(activity => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { color, ...rest } = activity;
          return rest;
        });
      };

      if (parsed.positive?.activities) {
        parsed.positive.activities = migrateActivities(parsed.positive.activities);
      }
      if (parsed.negative?.activities) {
        parsed.negative.activities = migrateActivities(parsed.negative.activities);
      }

      return parsed;
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
    return importData(jsonString);
  }
}

// Standalone export/import functions for use in components
export function exportData(data: EnergyKuchen): string {
  return JSON.stringify(data, null, 2);
}

export function importData(jsonString: string): EnergyKuchen {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = JSON.parse(jsonString) as any;

    // Basic validation - we need at least positive or negative data
    if (!data.positive && !data.negative) {
      throw new Error('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');
    }

    // Validate activities have required fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validateActivities = (activities: any[]): any[] => {
      if (!Array.isArray(activities)) return [];

      return activities
        .map(activity => {
          // Migration: Remove color property if it exists
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { color, ...activityWithoutColor } = activity;

          return activityWithoutColor;
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
    const positiveActivities = data.positive?.activities ? validateActivities(data.positive.activities) : [];
    const negativeActivities = data.negative?.activities ? validateActivities(data.negative.activities) : [];

    // Create a complete data structure with defaults
    const now = new Date().toISOString();
    const result: EnergyKuchen = {
      version: data.version || '1.0',
      lastModified: data.lastModified || now,
      positive: {
        id: 'positive',
        type: 'positive',
        activities: positiveActivities,
        size: data.positive?.size || 'medium',
      },
      negative: {
        id: 'negative',
        type: 'negative',
        activities: negativeActivities,
        size: data.negative?.size || 'medium',
      },
    };

    return result;
  } catch (error) {
    console.error('Failed to import data:', error);
    if (error instanceof Error && (error.message.includes('Aktivität') || error.message.includes('Energieniveau'))) {
      throw error; // Re-throw validation errors with specific messages
    }
    throw new Error('Ungültige Datei oder Datenformat');
  }
}
