'use client';

import { ActivityColorBadge } from '@/app/components/ui/ActivityColorBadge';
import { cn } from '@/app/lib/utils/cn';
import { Activity } from '@/app/types';

interface ChartLegendProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
  className?: string;
}

export function ChartLegend({ activities, onActivityClick, className }: ChartLegendProps) {
  if (activities.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map(activity => (
        <div
          key={activity.id}
          className={cn('flex items-center justify-between rounded p-2 transition-colors hover:bg-gray-50', onActivityClick && 'cursor-pointer')}
          onClick={() => onActivityClick?.(activity.id)}>
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <ActivityColorBadge value={activity.value} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">{activity.name}</div>
              {activity.details && (
                <div className="mt-1 text-xs whitespace-pre-wrap text-gray-600" data-testid={`activity-details-${activity.id}`}>
                  {activity.details}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
