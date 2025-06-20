import type { Metadata } from 'next';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import './globals.css';
import { EnergyProvider } from './lib/contexts/EnergyContext';
import { UIProvider } from './lib/contexts/UIContext';

export const metadata: Metadata = {
  title: 'Energiekuchen - Visualisiere deine Energieverteilung',
  description: 'Ein visuelles Coaching-Tool zur Bewertung und Optimierung deiner Energiequellen und -verbraucher im täglichen Leben.',
  keywords: ['Energie', 'Coaching', 'Visualisierung', 'Balance', 'Wohlbefinden'],
  authors: [{ name: 'Tobias Hagemann' }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="flex min-h-screen flex-col bg-gray-50 antialiased">
        <EnergyProvider>
          <UIProvider>
            <div className="flex flex-1 flex-col">{children}</div>
            <Footer />
            <Toast />
          </UIProvider>
        </EnergyProvider>
      </body>
    </html>
  );
}
