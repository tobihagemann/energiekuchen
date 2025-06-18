import { EnergyProvider } from '@/app/share/SharedEnergyProvider';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Geteilter Energiekuchen',
  description: 'Sieh dir diesen Energiekuchen an, der mit dir geteilt wurde.',
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return <EnergyProvider>{children}</EnergyProvider>;
}
