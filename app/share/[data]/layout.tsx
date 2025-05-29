'use client';

import { Toast } from '@/app/components/ui/Toast';
import { UIProvider } from '@/app/lib/contexts/UIContext';
import { EnergyProvider } from './SharedEnergyProvider';

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <EnergyProvider>
      <UIProvider>
        {children}
        <Toast />
      </UIProvider>
    </EnergyProvider>
  );
}
