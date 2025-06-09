'use client';

import { calculatePercentage, calculateTotalEnergy } from '@/app/lib/utils/calculations';
import { cn } from '@/app/lib/utils/cn';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { Activity } from '@/app/types';

interface ChartLegendProps {
  activities: Activity[];
  chartType: 'positive' | 'negative';
  onActivityClick?: (activityId: string) => void;
  className?: string;
}

export function ChartLegend({ activities, chartType, onActivityClick, className }: ChartLegendProps) {
  if (activities.length === 0) {
    return null;
  }

  const total = calculateTotalEnergy(activities);

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map(activity => {
        const percentage = calculatePercentage(activity.value, total);

        return (
          <div
            key={activity.id}
            className={cn('flex items-center justify-between rounded p-2 transition-colors hover:bg-gray-50', onActivityClick && 'cursor-pointer')}
            onClick={() => onActivityClick?.(activity.id)}>
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: getColorForLevel(activity.value, chartType) }} />
              <span className="truncate text-sm font-medium text-gray-900">{activity.name}</span>
            </div>

            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>{activity.value}</span>
              <span className="text-xs">({percentage}%)</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
