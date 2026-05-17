import { Activity, EnergyPie, LabelOffset, Polarity } from '@/app/types';
import { UnknownActivity, UnknownData, V1Data, V2Data } from '@/app/types/migration';

import { STORAGE_KEY } from './constants';
import { round2 } from './floor';
import { renormalizeToFloor } from './redistribution';
import { validateActivity, validateActivityValue, validateLabelOffset } from './validation';

const isDefaultLabelOffset = (offset: LabelOffset | undefined): boolean => !offset || (offset.radial === 0 && offset.angular === 0);

interface ImportResult {
  data: EnergyPie;
  migrated: boolean;
}

export class StorageManager {
  static save(data: EnergyPie): void {
    try {
      const serialized = JSON.stringify(toV3Serializable(data));
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

      try {
        const { data, migrated } = importDataDetailed(serialized);
        if (migrated) {
          try {
            StorageManager.save(data);
          } catch (writeError) {
            // Write-back is best-effort; a quota error must not crash the load path.
            // The legacy payload stays in localStorage and migrates again on next load.
            console.error('Failed to write back migrated data:', writeError);
          }
        }
        return data;
      } catch (validationError) {
        console.error('Validation failed when loading from localStorage:', validationError);
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

    return JSON.stringify(toV3Serializable(data), null, 2);
  }

  static import(jsonString: string): EnergyPie {
    return importData(jsonString);
  }
}

export function exportData(data: EnergyPie): string {
  return JSON.stringify(toV3Serializable(data), null, 2);
}

// Returns an EnergyPie-shaped object with weights rounded to 2 decimals and default
// labelOffset elided. Callers serialize as needed (compact for save, pretty for export).
export function toV3Serializable(data: EnergyPie): EnergyPie {
  const mapActivities = (activities: Activity[]): Activity[] =>
    activities.map(a => {
      const slim: Activity = {
        id: a.id,
        name: a.name,
        weight: round2(a.weight),
        polarity: a.polarity,
      };
      if (a.details) slim.details = a.details;
      if (!isDefaultLabelOffset(a.labelOffset)) slim.labelOffset = a.labelOffset;
      return slim;
    });

  return {
    version: '3.0',
    current: { activities: mapActivities(data.current.activities) },
    desired: { activities: mapActivities(data.desired.activities) },
  };
}

function migrateV1ToV2(data: V1Data): V2Data {
  const positiveActivities = data.positive?.activities || [];
  const negativeActivities = data.negative?.activities || [];

  const migratedPositive = positiveActivities.map(a => ({ ...a, value: Math.abs(a.value) }));
  const migratedNegative = negativeActivities.map(a => ({ ...a, value: -Math.abs(a.value) }));

  return {
    version: '2.0',
    current: { activities: [...migratedPositive, ...migratedNegative] },
    desired: { activities: [] },
  };
}

function ensureActivityId(id: unknown): string {
  return typeof id === 'string' && id.length > 0 ? id : crypto.randomUUID();
}

interface ActivityWalkResult {
  activity: Activity | null;
  migrated: boolean;
}

// v2 payload: missing-both-fields entries are dropped with a German console warning
// (silent recovery, R3). v3 payload: missing required fields throw (R35) — the full
// validateActivity rule set runs so import cannot enter a state the UI validators would reject.
function walkActivity(raw: UnknownActivity, payloadIsV3: boolean): ActivityWalkResult {
  const hasWeight = typeof raw.weight === 'number' && Number.isFinite(raw.weight);
  const hasPolarity = raw.polarity === 'positive' || raw.polarity === 'negative';
  const hasLegacyValue = typeof raw.value === 'number';

  if (hasWeight && hasPolarity) {
    const candidate = {
      id: ensureActivityId(raw.id),
      name: typeof raw.name === 'string' ? raw.name : '',
      weight: raw.weight as number,
      polarity: raw.polarity as Polarity,
      details: typeof raw.details === 'string' ? raw.details : undefined,
    };
    const result = validateActivity(candidate);
    if (!result.isValid) {
      throw new Error(result.errors[0]);
    }
    const activity: Activity = {
      id: candidate.id,
      name: candidate.name,
      weight: candidate.weight,
      polarity: candidate.polarity,
    };
    if (candidate.details) activity.details = candidate.details;
    if (raw.labelOffset !== undefined && raw.labelOffset !== null) {
      const offsetResult = validateLabelOffset(raw.labelOffset);
      if (offsetResult.isValid && offsetResult.normalized) {
        activity.labelOffset = offsetResult.normalized;
      }
    }
    return { activity, migrated: false };
  }

  if (typeof raw.name !== 'string' || raw.name.length === 0) {
    throw new Error('Aktivität muss einen Namen haben');
  }
  const name = raw.name;

  if (payloadIsV3) {
    throw new Error('Aktivität muss Gewicht und Polarität haben');
  }

  if (!hasLegacyValue) {
    console.warn(`Aktivität "${name}" mit ungültigem Wert beim Import verworfen`);
    return { activity: null, migrated: true };
  }

  const legacyValue = raw.value as number;
  const valueValidation = validateActivityValue(legacyValue);
  if (!valueValidation.isValid) {
    console.warn(`Aktivität "${name}" mit ungültigem Wert beim Import verworfen`);
    return { activity: null, migrated: true };
  }

  const activity: Activity = {
    id: ensureActivityId(raw.id),
    name,
    weight: Math.pow(2, Math.abs(legacyValue) - 1),
    polarity: legacyValue > 0 ? 'positive' : 'negative',
  };
  if (typeof raw.details === 'string') activity.details = raw.details;
  return { activity, migrated: true };
}

function detectPayloadVersion(data: UnknownData): 'v2' | 'v3' {
  if (data.version === '3.0') return 'v3';
  if (data.version === '2.0') return 'v2';

  const allActivities = [
    ...(Array.isArray(data.current?.activities) ? data.current.activities : []),
    ...(Array.isArray(data.desired?.activities) ? data.desired.activities : []),
  ];

  if (allActivities.length === 0) return 'v2';

  for (const raw of allActivities) {
    const act = raw as UnknownActivity;
    const hasWeight = typeof act.weight === 'number' && Number.isFinite(act.weight);
    const hasPolarity = act.polarity === 'positive' || act.polarity === 'negative';
    if (!hasWeight || !hasPolarity) return 'v2';
  }
  return 'v3';
}

export function importData(jsonString: string): EnergyPie {
  return importDataDetailed(jsonString).data;
}

function importDataDetailed(jsonString: string): ImportResult {
  try {
    const parsed = JSON.parse(jsonString) as UnknownData;
    let data = parsed;
    let migrated = false;

    if (parsed.positive || parsed.negative) {
      data = migrateV1ToV2(parsed as V1Data) as UnknownData;
      migrated = true;
    }

    if (!data.current && !data.desired) {
      throw new Error('Ungültiges Datenformat - keine Aktivitätsdaten gefunden');
    }

    const payloadVersion = detectPayloadVersion(data);
    const payloadIsV3 = payloadVersion === 'v3';
    if (payloadVersion === 'v2') migrated = true;

    const walkActivities = (activities: unknown): Activity[] => {
      if (!Array.isArray(activities)) return [];
      const out: Activity[] = [];
      for (const raw of activities) {
        const { activity, migrated: entryMigrated } = walkActivity(raw as UnknownActivity, payloadIsV3);
        if (entryMigrated) migrated = true;
        if (activity) out.push(activity);
      }
      return out;
    };

    const currentActivities = renormalizeToFloor(walkActivities(data.current?.activities));
    const desiredActivities = renormalizeToFloor(walkActivities(data.desired?.activities));

    const result: EnergyPie = {
      version: '3.0',
      current: { activities: currentActivities },
      desired: { activities: desiredActivities },
    };

    return { data: result, migrated };
  } catch (error) {
    console.error('Failed to import data:', error);
    if (
      error instanceof Error &&
      (error.message.includes('Aktivität') ||
        error.message.includes('Anteil') ||
        error.message.includes('Gewicht') ||
        error.message.includes('Polarität') ||
        error.message.includes('keine Aktivitätsdaten'))
    ) {
      throw error;
    }
    throw new Error('Ungültige Datei oder Datenformat');
  }
}
