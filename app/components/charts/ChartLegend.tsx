'use client';

import { calculatePercentage, calculateTotalEnergy } from '@/app/lib/utils/calculations';
import { cn } from '@/app/lib/utils/cn';
import { Activity } from '@/app/types';

interface ChartLegendProps {
  activities: Activity[];
  onActivityClick?: (activityId: string) => void;
  className?: string;
}

export function ChartLegend({ 
  activities, 
  onActivityClick, 
  className 
}: ChartLegendProps) {
  if (activities.length === 0) {
    return null;
  }

  const total = calculateTotalEnergy(activities);

  return (
    <div className={cn('space-y-2', className)}>
      {activities.map((activity) => {
        const percentage = calculatePercentage(activity.value, total);
        
        return (
          <div
            key={activity.id}
            className={cn(
              'flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors',
              onActivityClick && 'cursor-pointer'
            )}
            onClick={() => onActivityClick?.(activity.id)}
          >
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: activity.color }}
              />
              <span className="text-sm font-medium text-gray-900 truncate">
                {activity.name}
              </span>
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
