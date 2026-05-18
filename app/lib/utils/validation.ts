import { Activity, LabelOffset, ValidationResult } from '@/app/types';

const VALIDATION_RULES = {
  activity: {
    name: {
      minLength: 1,
      maxLength: 50,
      // Allow all printable Unicode characters (emojis, accents, symbols)
      // Only block control characters (null bytes, line breaks, etc.)
      // eslint-disable-next-line no-control-regex -- intentional control character matching
      pattern: /^[^\x00-\x1F\x7F]+$/,
    },
    details: {
      maxLength: 150,
    },
    weight: {
      maxExclusiveLowerBound: 0,
      max: 10000,
    },
    legacyValue: {
      min: -5,
      max: 5,
      type: 'integer',
    },
    labelOffset: {
      radialMin: -0.5,
      radialMax: 1.0,
      radialPrecision: 3,
      angularPrecision: 4,
    },
  },
  chart: {
    maxActivities: 20,
    minActivities: 0,
  },
} as const;

// Activity id contract: per-activity validation does NOT require a non-empty id.
// Migration and v3 import paths assign a fresh crypto.randomUUID() when the id is
// missing or empty so legacy / external payloads still load.
export function validateActivity(activity: Partial<Activity>): ValidationResult {
  const errors: string[] = [];

  if (!activity.name || activity.name.length < VALIDATION_RULES.activity.name.minLength) {
    errors.push('Aktivitätsname ist erforderlich');
  }

  if (activity.name && activity.name.length > VALIDATION_RULES.activity.name.maxLength) {
    errors.push(`Aktivitätsname darf maximal ${VALIDATION_RULES.activity.name.maxLength} Zeichen haben`);
  }

  if (activity.name && !VALIDATION_RULES.activity.name.pattern.test(activity.name)) {
    errors.push('Aktivitätsname enthält ungültige Zeichen');
  }

  const weightResult = validateActivityWeight(activity.weight);
  if (!weightResult.isValid) {
    errors.push(...weightResult.errors);
  }

  const polarityResult = validateActivityPolarity(activity.polarity);
  if (!polarityResult.isValid) {
    errors.push(...polarityResult.errors);
  }

  if (activity.details && activity.details.length > VALIDATION_RULES.activity.details.maxLength) {
    errors.push(`Details dürfen maximal ${VALIDATION_RULES.activity.details.maxLength} Zeichen haben`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateChartActivities(activities: Activity[]): ValidationResult {
  const errors: string[] = [];

  if (activities.length > VALIDATION_RULES.chart.maxActivities) {
    errors.push(`Maximal ${VALIDATION_RULES.chart.maxActivities} Aktivitäten erlaubt`);
  }

  const names = activities.map(a => a.name.toLowerCase());
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);

  if (duplicates.length > 0) {
    errors.push('Aktivitätsnamen müssen eindeutig sein');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateActivityName(name: string): ValidationResult {
  const errors: string[] = [];

  if (!name || name.length < VALIDATION_RULES.activity.name.minLength) {
    errors.push('Name darf nicht leer sein');
  }

  if (name && name.length > VALIDATION_RULES.activity.name.maxLength) {
    errors.push(`Name darf maximal ${VALIDATION_RULES.activity.name.maxLength} Zeichen haben`);
  }

  if (name && !VALIDATION_RULES.activity.name.pattern.test(name)) {
    errors.push('Name enthält ungültige Zeichen');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateActivityWeight(weight: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof weight !== 'number' || !Number.isFinite(weight) || weight <= VALIDATION_RULES.activity.weight.maxExclusiveLowerBound) {
    errors.push('Gewicht muss eine positive Zahl sein');
  } else if (weight > VALIDATION_RULES.activity.weight.max) {
    errors.push(`Gewicht darf ${VALIDATION_RULES.activity.weight.max} nicht überschreiten`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateActivityPolarity(polarity: unknown): ValidationResult {
  const errors: string[] = [];

  if (polarity !== 'positive' && polarity !== 'negative') {
    errors.push('Polarität muss positiv oder negativ sein');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

interface LabelOffsetValidationResult extends ValidationResult {
  normalized?: LabelOffset;
}

export function validateLabelOffset(offset: unknown): LabelOffsetValidationResult {
  if (!offset || typeof offset !== 'object') {
    return { isValid: false, errors: ['Label-Versatz ist ungültig'] };
  }

  const candidate = offset as { radial?: unknown; angular?: unknown };
  const radial = candidate.radial;
  const angular = candidate.angular;

  if (typeof radial !== 'number' || !Number.isFinite(radial) || typeof angular !== 'number' || !Number.isFinite(angular)) {
    return { isValid: false, errors: ['Label-Versatz ist ungültig'] };
  }

  const radialPrecision = VALIDATION_RULES.activity.labelOffset.radialPrecision;
  const angularPrecision = VALIDATION_RULES.activity.labelOffset.angularPrecision;
  const radialScale = Math.pow(10, radialPrecision);
  const angularScale = Math.pow(10, angularPrecision);

  const clampedRadial = Math.max(VALIDATION_RULES.activity.labelOffset.radialMin, Math.min(VALIDATION_RULES.activity.labelOffset.radialMax, radial));
  const normalizedRadial = Math.round(clampedRadial * radialScale) / radialScale;

  // Normalize angular into (-π, π]
  const twoPi = Math.PI * 2;
  let normalizedAngular = ((((angular + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
  if (normalizedAngular <= -Math.PI) normalizedAngular += twoPi;
  normalizedAngular = Math.round(normalizedAngular * angularScale) / angularScale;

  return {
    isValid: true,
    errors: [],
    normalized: { radial: normalizedRadial, angular: normalizedAngular },
  };
}

// Internal helper for v2 → v3 storage migration: validates the legacy signed-integer
// `value` field before it gets transformed into weight + polarity. The German `errors[]`
// strings are *not* shown to users — invalid legacy values are warn-and-dropped in
// `walkActivity`. We keep the `ValidationResult` shape only so the call site can use the
// shared `.isValid` check.
export function validateActivityValue(value: number): ValidationResult {
  const errors: string[] = [];

  if (value < VALIDATION_RULES.activity.legacyValue.min || value > VALIDATION_RULES.activity.legacyValue.max) {
    errors.push('Anteil muss zwischen -5 und +5 liegen');
  }

  if (value === 0) {
    errors.push('Anteil darf nicht 0 sein');
  }

  if (!Number.isInteger(value)) {
    errors.push('Anteil muss eine ganze Zahl sein');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
