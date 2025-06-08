'use client';

import { ChartLegend } from '@/app/components/charts/ChartLegend';
import { SharingManager } from '@/app/lib/utils/sharing';
import { EnergyKuchen } from '@/app/types';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharedEnergyChart() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<EnergyKuchen | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSharedData = () => {
      try {
        if (!params.data || typeof params.data !== 'string') {
          throw new Error('Ungültige Sharing-Daten');
        }

        // URL parameters are automatically URL-decoded by Next.js router,
        // but if they contain URL-encoded characters, we need to decode them again
        const urlDecodedData = decodeURIComponent(params.data);
        const decodedData = SharingManager.decodeShareData(urlDecodedData);

        setData(decodedData);
      } catch (err) {
        console.error('Failed to decode shared data:', err);
        router.push('/');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedData();
  }, [params, router]);

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
            <div className="flex items-center space-x-3">
              <Image src="/logo-32@2x.png" alt="Energiekuchen Logo" width={32} height={32} className="h-8 w-8" />
              <h1 className="text-xl font-bold text-gray-900">Geteilter Energiekuchen</h1>
            </div>
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
              <div className="mb-6 text-center">
                <h2 className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-900">
                  <span className="text-2xl">⚡</span>
                  Energiequellen
                </h2>
                {data.positive.activities.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {data.positive.activities.length} Aktivität{data.positive.activities.length !== 1 ? 'en' : ''}
                  </p>
                )}
              </div>

              <div data-testid="activity-list-positive">
                {data.positive.activities.length > 0 ? (
                  <ChartLegend activities={data.positive.activities} />
                ) : (
                  <div className="py-4 text-center text-gray-500">
                    <div className="text-sm">Keine Energiequellen vorhanden</div>
                  </div>
                )}
              </div>
            </div>

            {/* Negative Energy Chart */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-6 text-center">
                <h2 className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-900">
                  <span className="text-2xl">🔋</span>
                  Energieverbraucher
                </h2>
                {data.negative.activities.length > 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    {data.negative.activities.length} Aktivität{data.negative.activities.length !== 1 ? 'en' : ''}
                  </p>
                )}
              </div>

              <div data-testid="activity-list-negative">
                {data.negative.activities.length > 0 ? (
                  <ChartLegend activities={data.negative.activities} />
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
