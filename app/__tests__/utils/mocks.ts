import { Activity, EnergyKuchen } from '@/app/types';
import { v4 as uuidv4 } from 'uuid';

export function createMockActivity(overrides?: Partial<Activity>): Activity {
  return {
    id: uuidv4(),
    name: 'Test Activity',
    value: 50,
    color: '#10B981',
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
      activities: Array.from({ length: activitiesCount }, (_, i) => createMockActivity({ name: `Negative Activity ${i + 1}`, color: '#EF4444' })),
      size: 'medium',
    },
    settings: {
      chartSize: 'medium',
      colorScheme: 'default',
      showTooltips: true,
      showLegends: true,
      language: 'de',
    },
  };
}
