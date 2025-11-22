'use client';

import { cn } from '@/app/lib/utils/cn';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  variant?: 'primary' | 'current';
  className?: string;
}

export function LoadingSpinner({ size = 'md', message, variant = 'primary', className }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const colors = {
    primary: 'border-yellow-400',
    current: 'border-current',
  };

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className="text-center">
        <div
          className={cn('animate-spin rounded-full border-b-2', sizes[size], colors[variant], message ? 'mx-auto' : '')}
          role="status"
          aria-label="Loading"
        />
        {message && <p className="mt-4 text-gray-600">{message}</p>}
      </div>
    </div>
  );
}
