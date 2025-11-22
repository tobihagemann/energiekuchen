import { useEffect } from 'react';

export function useEnterKeySubmit(isActive: boolean, onSubmit: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && isActive) {
        e.preventDefault();
        onSubmit();
      }
    };

    if (isActive) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onSubmit]);
}
