import { Activity, ValidationResult } from '@/app/types';

const VALIDATION_RULES = {
  activity: {
    name: {
      minLength: 1,
      maxLength: 50,
      pattern: /^[a-zA-ZäöüÄÖÜß0-9\s\-_.,!?]+$/,
    },
    level: {
      min: 1,
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

  if (!activity.value || activity.value < VALIDATION_RULES.activity.level.min || activity.value > VALIDATION_RULES.activity.level.max) {
    errors.push('Energieniveau muss zwischen 1 und 5 liegen');
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
    errors.push('Energieniveau muss zwischen 1 und 5 liegen');
  }

  if (!Number.isInteger(value)) {
    errors.push('Energieniveau muss eine ganze Zahl sein');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
