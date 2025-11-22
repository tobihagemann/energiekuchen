'use client';

import { cn } from '@/app/lib/utils/cn';
import { MinusCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';

interface ActivityValueIndicatorProps {
  value: number;
  className?: string;
}

export function ActivityValueIndicator({ value, className }: ActivityValueIndicatorProps) {
  const absValue = Math.abs(value);
  const isPositive = value > 0;

  if (value === 0) return null;

  return (
    <div className={cn('flex items-center', className)} data-testid="activity-value-indicator">
      {Array.from({ length: absValue }, (_, i) => (
        <span key={i} className="inline-block">
          {isPositive ? <PlusCircleIcon className="h-4 w-4" /> : <MinusCircleIcon className="h-4 w-4" />}
        </span>
      ))}
    </div>
  );
}
