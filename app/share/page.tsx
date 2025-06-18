'use client';

import { ChartLegend } from '@/app/components/charts/ChartLegend';
import { EnergyChart } from '@/app/components/charts/EnergyChart';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { SharingManager } from '@/app/lib/utils/sharing';
import { EnergyPie } from '@/app/types';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharedEnergyChart() {
  const router = useRouter();
  const { dispatch } = useEnergy();
  const [data, setData] = useState<EnergyPie | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSharedData = () => {
      try {
        // Get the fragment from the URL
        const hash = window.location.hash;
        if (!hash || hash.length <= 1) {
          throw new Error('Keine Sharing-Daten gefunden');
        }

        // Remove the # character
        const encodedData = hash.substring(1);

        // Decode the share data
        const decodedData = SharingManager.decodeShareData(encodedData);

        setData(decodedData);
        // Set the data in the context so charts can use it
        dispatch({ type: 'SET_DATA', payload: decodedData, shouldSave: false });
      } catch (err) {
        console.error('Failed to decode shared data:', err);
        router.push('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    // Load data on mount and when hash changes
    loadSharedData();

    // Listen for hash changes
    const handleHashChange = () => {
      loadSharedData();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [router, dispatch]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Energiekuchen wird geladen...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return null; // This shouldn't be reached due to redirect in catch block
  }

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
              <Image src="/logo-32@2x.png" alt="Energiekuchen Logo" width={32} height={32} className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">Energiekuchen</h1>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-yellow-100 px-3 py-2 text-sm font-medium text-yellow-700 transition-colors hover:bg-yellow-200">
              Eigenen erstellen
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Positive Energy Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <EnergyChart chartType="positive" className="mb-6" />

              <div data-testid="activity-list-positive">
                {data.positive.activities.length > 0 ? (
                  <>
                    <h3 className="mb-3 text-lg font-medium text-gray-900">
                      Aktivitäten
                      <span className="ml-2 text-sm font-normal text-gray-500">({data.positive.activities.length})</span>
                    </h3>
                    <ChartLegend activities={data.positive.activities} chartType="positive" />
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <div className="text-sm">Keine Energiequellen vorhanden</div>
                  </div>
                )}
              </div>
            </div>

            {/* Negative Energy Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <EnergyChart chartType="negative" className="mb-6" />

              <div data-testid="activity-list-negative">
                {data.negative.activities.length > 0 ? (
                  <>
                    <h3 className="mb-3 text-lg font-medium text-gray-900">
                      Aktivitäten
                      <span className="ml-2 text-sm font-normal text-gray-500">({data.negative.activities.length})</span>
                    </h3>
                    <ChartLegend activities={data.negative.activities} chartType="negative" />
                  </>
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <div className="text-sm">Keine Energieverbraucher vorhanden</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
            <div className="text-center">
              <div className="mb-4 flex justify-center">
                <Image src="/logo-32@2x.png" alt="Energiekuchen Logo" width={32} height={32} />
              </div>
              <h3 className="mb-2 text-lg font-medium text-yellow-800">Gefällt dir dieser Energiekuchen?</h3>
              <p className="mb-4 text-yellow-700">Erstelle deinen eigenen Energiekuchen und teile ihn mit anderen!</p>
              <Link
                href="/"
                className="inline-flex items-center rounded-md bg-yellow-400 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-yellow-500">
                Jetzt starten
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
