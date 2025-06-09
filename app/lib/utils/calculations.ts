import { Activity } from '@/app/types';

export function calculateTotalEnergy(activities: Activity[]): number {
  return activities.reduce((total, activity) => total + activity.value, 0);
}

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function sortActivitiesByValue(activities: Activity[], descending: boolean = true): Activity[] {
  return [...activities].sort((a, b) => (descending ? b.value - a.value : a.value - b.value));
}
