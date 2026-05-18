import { Metadata } from 'next';

import { EnergyProvider } from '@/app/share/SharedEnergyProvider';

export const metadata: Metadata = {
  title: 'Geteilter Energiekuchen',
  description: 'Sieh dir diesen Energiekuchen an, der mit dir geteilt wurde.',
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <EnergyProvider>{children}</EnergyProvider>;
}
