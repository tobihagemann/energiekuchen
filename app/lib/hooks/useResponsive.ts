'use client';

import { BREAKPOINTS } from '@/app/lib/utils/constants';
import { useEffect, useState } from 'react';

export function useResponsive() {
  const [isSmall, setIsSmall] = useState(false);
  const [isMedium, setIsMedium] = useState(false);
  const [isLarge, setIsLarge] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      setIsSmall(width < BREAKPOINTS.small);
      setIsMedium(width >= BREAKPOINTS.small && width < BREAKPOINTS.medium);
      setIsLarge(width >= BREAKPOINTS.medium);
    };

    checkScreenSize();

    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return { isSmall, isMedium, isLarge };
}
