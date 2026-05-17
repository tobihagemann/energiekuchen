'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/app/lib/utils/cn';

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
  disabled?: boolean;
  color?: string;
  ariaLabel?: string;
  ariaValuetext?: string;
  'data-testid'?: string;
}

const DEFAULT_RING_COLOR = 'oklch(0.852 0.199 91.936)'; // yellow-400

export function Slider({
  value,
  onChange,
  min = 1,
  max = 100,
  step = 1,
  label,
  className,
  disabled = false,
  color,
  ariaLabel,
  ariaValuetext,
  'data-testid': testId,
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);

  const range = max - min || 1;
  const percentage = ((value - min) / range) * 100;

  // Single unidirectional fill from the left edge to the thumb's center.
  const thumbPosition = `calc(${percentage}% - ${(percentage / 100) * 24}px)`;
  const fillWidth = `calc(${percentage}% - ${(percentage / 100) * 24}px + 12px)`;

  const fillColor = color ?? 'oklch(0.872 0.01 258.338)'; // gray-300 fallback
  const ringColor = color ?? DEFAULT_RING_COLOR;

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    let next: number | null = null;
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = value - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = value + step;
        break;
      case 'Home':
        next = min;
        break;
      case 'End':
        next = max;
        break;
    }
    if (next !== null) {
      e.preventDefault();
      onChange(Math.max(min, Math.min(max, next)));
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !disabled) updateValue(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging && !disabled) {
        e.preventDefault();
        updateValue(e.touches[0].clientX);
      }
    };

    const handleEnd = () => setIsDragging(false);

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
      {label && <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- pointer hit-area for a custom slider; semantic role + keyboard handlers live on the thumb */}
      <div
        ref={sliderRef}
        className={cn('relative h-6 cursor-pointer touch-none rounded-full bg-gray-200', disabled && 'cursor-not-allowed opacity-50')}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        data-testid={testId}>
        <div
          className="absolute top-0 h-full"
          style={{
            left: '0px',
            width: fillWidth,
            backgroundColor: color ? fillColor : undefined,
          }}
        />
        <div
          // eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- a real <input type="range"> can't render the custom thumb/fill geometry this design needs
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={value}
          aria-label={ariaLabel}
          aria-valuetext={ariaValuetext}
          aria-disabled={disabled}
          onKeyDown={handleKeyDown}
          className={cn(
            'absolute top-1/2 h-6 w-6 -translate-y-1/2 transform rounded-full border-2 bg-white shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
            isDragging && 'scale-110 shadow-md'
          )}
          style={{
            left: thumbPosition,
            borderColor: disabled ? 'oklch(0.872 0.01 258.338)' : ringColor,
          }}
        />
      </div>
    </div>
  );
}
