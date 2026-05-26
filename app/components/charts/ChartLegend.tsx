'use client';

import { ActivityColorBadge } from '@/app/components/ui/ActivityColorBadge';
import { cn } from '@/app/lib/utils/cn';
import { getPercentage } from '@/app/lib/utils/percentage';
import { assignShadeDepths } from '@/app/lib/utils/shade';
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

  const totalWeight = activities.reduce((sum, a) => sum + a.weight, 0);
  const shadeDepths = assignShadeDepths(activities);

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map(activity => (
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- click handler is optional enhancement
        <div
          key={activity.id}
          className={cn('flex items-center justify-between rounded p-2 transition-colors hover:bg-gray-50', onActivityClick && 'cursor-pointer')}
          onClick={() => onActivityClick?.(activity.id)}>
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            <ActivityColorBadge polarity={activity.polarity} depth={shadeDepths[activity.id]} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-gray-900">
                {activity.name}
                <span className="ml-2 text-xs text-gray-500">{getPercentage(activity.weight, totalWeight)} %</span>
              </div>
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
