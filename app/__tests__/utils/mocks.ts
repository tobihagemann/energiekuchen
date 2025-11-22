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
    version: '2.0',
    current: {
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Current Activity ${i + 1}` })),
    },
    desired: {
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Desired Activity ${i + 1}` })),
    },
  };
}
