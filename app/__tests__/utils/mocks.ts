import { Activity, EnergyPie } from '@/app/types';

export function createMockActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: crypto.randomUUID(),
    name: 'Test Activity',
    value: 3,
    ...overrides,
  };
}

export function createMockEnergyPie(options?: { activitiesCount?: number }): EnergyPie {
  const activitiesCount = options?.activitiesCount || 2;

  return {
    version: '1.0',
    positive: {
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Positive Activity ${i + 1}` })),
    },
    negative: {
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Negative Activity ${i + 1}` })),
    },
  };
}
