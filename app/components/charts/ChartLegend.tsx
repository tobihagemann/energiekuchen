'use client';

import { cn } from '@/app/lib/utils/cn';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { Activity } from '@/app/types';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

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

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map(activity => {
        return (
          <div
            key={activity.id}
            className={cn('flex items-center justify-between rounded p-2 transition-colors hover:bg-gray-50', onActivityClick && 'cursor-pointer')}
            onClick={() => onActivityClick?.(activity.id)}>
            <div className="flex min-w-0 flex-1 items-center space-x-3">
              <div className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: getColorForLevel(activity.value, chartType) }} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">{activity.name}</div>
                <div className="flex items-center text-xs text-gray-500">
                  {Array.from({ length: activity.value }, (_, i) => (
                    <span key={i} className="inline-block">
                      {chartType === 'positive' ? <PlusCircleIcon className="h-3 w-3" /> : <MinusCircleIcon className="h-3 w-3" />}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
