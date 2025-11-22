'use client';

import { cn } from '@/app/lib/utils/cn';

interface ErrorMessageProps {
  error?: string | string[];
  testId?: string;
  className?: string;
}

export function ErrorMessage({ error, testId, className }: ErrorMessageProps) {
  if (!error) return null;

  const errors = Array.isArray(error) ? error : [error];

  if (errors.length === 0) return null;

  return (
    <div role="alert" aria-live="polite" className={cn('rounded-md border border-red-200 bg-red-50 p-3', className)} data-testid={testId}>
      <div className="text-sm text-red-700">
        {errors.map((err, index) => (
          <div key={index}>{err}</div>
        ))}
      </div>
    </div>
  );
}
