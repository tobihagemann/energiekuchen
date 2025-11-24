import { Activity, ValidationResult } from '@/app/types';

const VALIDATION_RULES = {
  activity: {
    name: {
      minLength: 1,
      maxLength: 50,
      // Allow all printable Unicode characters (emojis, accents, symbols)
      // Only block control characters (null bytes, line breaks, etc.)
      pattern: /^[^\x00-\x1F\x7F]+$/,
    },
    details: {
      maxLength: 150,
    },
    level: {
      min: -5,
      max: 5,
      type: 'integer',
    },
  },
  chart: {
    maxActivities: 20,
    minActivities: 0,
  },
} as const;

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

  if (
    activity.value === undefined ||
    activity.value === null ||
    activity.value < VALIDATION_RULES.activity.level.min ||
    activity.value > VALIDATION_RULES.activity.level.max
  ) {
    errors.push('Anteil muss zwischen -5 und +5 liegen');
  }

  if (activity.value === 0) {
    errors.push('Anteil darf nicht 0 sein');
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

export function validateActivityValue(value: number): ValidationResult {
  const errors: string[] = [];

  if (value < VALIDATION_RULES.activity.level.min || value > VALIDATION_RULES.activity.level.max) {
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
