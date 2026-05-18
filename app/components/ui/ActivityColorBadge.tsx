'use client';

import { cn } from '@/app/lib/utils/cn';
import { getColorForPolarity } from '@/app/lib/utils/constants';
import { Polarity } from '@/app/types';

interface ActivityColorBadgeProps {
  polarity: Polarity;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActivityColorBadge({ polarity, size = 'md', className }: ActivityColorBadgeProps) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return <div className={cn('shrink-0 rounded-full', sizes[size], className)} style={{ backgroundColor: getColorForPolarity(polarity) }} />;
}
