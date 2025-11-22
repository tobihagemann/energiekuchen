import { Activity, EnergyPie } from '@/app/types';
import { UnknownActivity, UnknownData, V1Data } from '@/app/types/migration';
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

function migrateV1ToV2(data: V1Data): EnergyPie {
  // Migrate v1.0 format (positive/negative) to v2.0 format (current/desired)
  const positiveActivities = data.positive?.activities || [];
  const negativeActivities = data.negative?.activities || [];

  // Convert positive activities (1-5) to current activities with positive values (+1 to +5)
  const migratedPositive = positiveActivities.map(activity => ({
    ...activity,
    value: Math.abs(activity.value), // Ensure positive
  }));

  // Convert negative activities (1-5) to current activities with negative values (-1 to -5)
  const migratedNegative = negativeActivities.map(activity => ({
    ...activity,
    value: -Math.abs(activity.value), // Ensure negative
  }));

  // Merge both into current chart, leave desired empty
  return {
    version: '2.0',
    current: {
      activities: [...migratedPositive, ...migratedNegative],
    },
    desired: {
      activities: [],
    },
  };
}

export function importData(jsonString: string): EnergyPie {
  try {
    const data = JSON.parse(jsonString) as UnknownData;

    // Check for old version format (v1.0 with positive/negative) and migrate it
    if (data.positive || data.negative) {
      const migratedData = migrateV1ToV2(data as V1Data);
      // Continue processing with migrated data
      return importData(JSON.stringify(migratedData));
    }

    // Basic validation - we need at least current or desired data
    if (!data.current && !data.desired) {
      throw new Error('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');
    }

    // Validate activities have required fields
    const validateActivities = (activities: unknown[]) => {
      if (!Array.isArray(activities)) return [];

      return activities.filter(activity => {
        const act = activity as UnknownActivity;
        // Check required fields
        if (!act.name || typeof act.name !== 'string') {
          throw new Error('Aktivität muss einen Namen haben');
        }
        if (act.value === undefined || typeof act.value !== 'number') {
          throw new Error('Aktivität muss ein Energieniveau haben');
        }

        // Validate that value is within the allowed range
        const valueValidation = validateActivityValue(act.value);
        if (!valueValidation.isValid) {
          throw new Error(valueValidation.errors[0]);
        }

        return true;
      });
    };

    // Validate and process activities
    const currentActivities = (data.current?.activities ? validateActivities(data.current.activities) : []) as Activity[];
    const desiredActivities = (data.desired?.activities ? validateActivities(data.desired.activities) : []) as Activity[];

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
    if (error instanceof Error && (error.message.includes('Aktivität') || error.message.includes('Energieniveau'))) {
      throw error; // Re-throw validation errors with specific messages
    }
    throw new Error('Ungültige Datei oder Datenformat');
  }
}
