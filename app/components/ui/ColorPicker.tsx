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

export function ColorPicker({ 
  color, 
  onChange, 
  label, 
  presets = [], 
  className 
}: ColorPickerProps) {
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
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 w-full p-2 border border-gray-300 rounded-md hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
      >
        <div
          className="w-6 h-6 rounded border border-gray-300"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-gray-700">{color}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 z-10 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
          <HexColorPicker color={color} onChange={onChange} />
          
          {presets.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Vorgaben</div>
              <div className="grid grid-cols-5 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => onChange(preset)}
                    className={cn(
                      'w-8 h-8 rounded border-2 hover:scale-110 transition-transform',
                      color === preset ? 'border-gray-900' : 'border-gray-300'
                    )}
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
