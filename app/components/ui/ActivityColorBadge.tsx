'use client';

import { cn } from '@/app/lib/utils/cn';
import { getShadeColor } from '@/app/lib/utils/shade';
import { Polarity } from '@/app/types';

interface ActivityColorBadgeProps {
  polarity: Polarity;
  // Weight-rank shade depth (see assignShadeDepths) so the dot matches its chart slice. Omitted
  // where there's no weight context, falling back to the band midpoint (the canonical mid-tone).
  depth?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ActivityColorBadge({ polarity, depth, size = 'md', className }: ActivityColorBadgeProps) {
  const sizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  const backgroundColor = getShadeColor(polarity, depth ?? 0.5);
  return <div className={cn('shrink-0 rounded-full', sizes[size], className)} style={{ backgroundColor }} />;
}
