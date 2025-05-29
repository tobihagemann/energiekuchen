'use client';

import { ChartLegend } from '@/app/components/charts/ChartLegend';
import { getEnergyBalance } from '@/app/lib/utils/calculations';
import { SharingManager } from '@/app/lib/utils/sharing';
import { EnergyKuchen } from '@/app/types';
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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

  const { positiveTotal, negativeTotal, balance } = getEnergyBalance(data.positive, data.negative);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🥧</div>
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

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Energy Balance Summary */}
        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm" data-testid="energy-balance-summary">
          <h2 className="mb-4 text-lg font-medium text-gray-900">Energiebilanz</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-green-50 p-4 text-center" data-testid="positive-energy-total">
              <div className="text-2xl font-bold text-green-600">{positiveTotal}</div>
              <div className="text-sm text-green-700">Energiequellen</div>
            </div>

            <div className="rounded-lg bg-red-50 p-4 text-center" data-testid="negative-energy-total">
              <div className="text-2xl font-bold text-red-600">{negativeTotal}</div>
              <div className="text-sm text-red-700">Energieverbraucher</div>
            </div>

            <div className={`rounded-lg p-4 text-center ${balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`} data-testid="energy-balance-total">
              <div className={`text-2xl font-bold ${balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                {balance >= 0 ? '+' : ''}
                {balance}
              </div>
              <div className={`text-sm ${balance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Energiebilanz</div>
            </div>
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            {balance > 0 && <p className="text-green-600">✅ Energieüberschuss von {balance} Punkten</p>}
            {balance === 0 && <p className="text-blue-600">⚖️ Perfekt ausbalancierte Energie</p>}
            {balance < 0 && <p className="text-orange-600">⚠️ Energiedefizit von {Math.abs(balance)} Punkten</p>}
          </div>
        </div>

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
            <div className="mb-4 text-4xl">🥧</div>
            <h3 className="mb-2 text-lg font-medium text-yellow-800">Gefällt dir dieser Energiekuchen?</h3>
            <p className="mb-4 text-yellow-700">Erstelle deinen eigenen Energiekuchen und teile ihn mit anderen!</p>
            <Link
              href="/"
              className="inline-flex items-center rounded-md bg-yellow-400 px-6 py-3 font-medium text-gray-900 transition-colors hover:bg-yellow-500">
              Jetzt starten
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
