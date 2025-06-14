'use client';

import { cn } from '@/app/lib/utils/cn';
import React, { useCallback, useEffect, useRef, useState } from 'react';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
  'data-testid'?: string;
}

export function Slider({ value, onChange, min = 0, max = 100, step = 1, label, className, disabled = false, 'data-testid': testId }: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  // Calculate thumb position to keep it within bounds
  // At 0%, thumb should be at left edge (0px)
  // At 100%, thumb should be at right edge minus thumb width (calc(100% - 24px))
  const thumbPosition = `calc(${percentage}% - ${(percentage / 100) * 24}px)`;

  // Calculate fill width to align with thumb center
  // Add half thumb width (12px) to the constrained position
  const fillWidth = `calc(${percentage}% - ${(percentage / 100) * 24}px + 12px)`;

  const updateValue = useCallback(
    (clientX: number) => {
      if (!sliderRef.current || disabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const newValue = min + ratio * (max - min);
      const steppedValue = Math.round(newValue / step) * step;

      onChange(Math.max(min, Math.min(max, steppedValue)));
    },
    [min, max, step, onChange, disabled]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    updateValue(e.touches[0].clientX);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !disabled) {
        updateValue(e.clientX);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && !disabled) {
        e.preventDefault();
        updateValue(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isDragging, disabled, updateValue]);

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-2 block text-sm font-medium text-gray-700">
          {label}: {value}
        </label>
      )}
      <div
        ref={sliderRef}
        className={cn('relative h-6 cursor-pointer touch-none rounded-full bg-gray-200', disabled && 'cursor-not-allowed opacity-50')}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        data-testid={testId}>
        <div className="absolute top-0 left-0 h-full rounded-l-full bg-yellow-400" style={{ width: fillWidth }} />
        <div
          className={cn(
            'absolute top-1/2 h-6 w-6 -translate-y-1/2 transform rounded-full border-2 border-yellow-400 bg-white shadow-sm',
            isDragging && 'scale-110 shadow-md',
            disabled && 'border-gray-300'
          )}
          style={{ left: thumbPosition }}
        />
      </div>
    </div>
  );
}
