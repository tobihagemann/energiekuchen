'use client';

import { cn } from '@/app/lib/utils/cn';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Modal({ isOpen, onClose, title, titleIcon, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-sm sm:max-w-md md:max-w-2xl lg:max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-50 transition-opacity" onClick={onClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        className={cn(
          'relative flex w-full flex-col rounded-lg bg-white shadow-xl transition-all',
          // Default max-height with fallback
          'max-h-[90vh]',
          // Use dynamic viewport height for browsers that support it
          'supports-[height:100dvh]:max-h-[90dvh]',
          // Additional constraint for mobile to account for browser UI
          'max-h-[calc(100vh-2rem)] supports-[height:100dvh]:max-h-[calc(100dvh-2rem)]',
          sizes[size],
          className
        )}>
        {title && (
          <div className="flex shrink-0 items-center justify-between border-b border-gray-200 p-4 sm:px-6">
            <h3 id="modal-title" className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              {titleIcon}
              {title}
            </h3>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0" data-testid="close-modal">
              <span className="sr-only">Schließen</span>
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
