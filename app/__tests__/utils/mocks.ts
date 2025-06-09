import { Activity, EnergyKuchen } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';

export function createMockActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: uuidv4(),
    name: 'Test Activity',
    value: 5,
    color: 'oklch(0.723 0.219 149.579)',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function createMockEnergyKuchen(options?: { activitiesCount?: number }): EnergyKuchen {
  const activitiesCount = options?.activitiesCount || 2;

  return {
    version: '1.0',
    lastModified: new Date().toISOString(),
    positive: {
      id: uuidv4(),
      type: 'positive',
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Positive Activity ${i + 1}` })),
      size: 'medium',
    },
    negative: {
      id: uuidv4(),
      type: 'negative',
      activities: Array.from({ length: activitiesCount }, (_, i) =>
        createMockActivity({ name: `Negative Activity ${i + 1}`, color: 'oklch(0.637 0.237 25.331)' })
      ),
      size: 'medium',
    },
  };
}
