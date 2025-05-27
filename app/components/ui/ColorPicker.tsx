'use client';

import { cn } from '@/app/lib/utils/cn';
import { useEffect, useRef, useState } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  label?: string;
  presets?: readonly string[];
  className?: string;
}

export function ColorPicker({ color, onChange, label, presets = [], className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      {label && <label className="mb-2 block text-sm font-medium text-gray-700">{label}</label>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center space-x-2 rounded-md border border-gray-300 p-2 hover:border-gray-400 focus:border-transparent focus:ring-2 focus:ring-yellow-500 focus:outline-none">
        <div className="h-6 w-6 rounded border border-gray-300" style={{ backgroundColor: color }} />
        <span className="text-sm text-gray-700">{color}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-2 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
          <HexColorPicker color={color} onChange={onChange} />

          {presets.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 text-sm font-medium text-gray-700">Vorgaben</div>
              <div className="grid grid-cols-5 gap-2">
                {presets.map(preset => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset)}
                    className={cn('h-8 w-8 rounded border-2 transition-transform hover:scale-110', color === preset ? 'border-gray-900' : 'border-gray-300')}
                    style={{ backgroundColor: preset }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
