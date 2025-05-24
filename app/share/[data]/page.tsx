'use client';

import { ChartLegend } from '@/app/components/charts/ChartLegend';
import { EnergyChart } from '@/app/components/charts/EnergyChart';
import { getEnergyBalance } from '@/app/lib/utils/calculations';
import { SharingManager } from '@/app/lib/utils/sharing';
import { EnergyKuchen } from '@/app/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharedEnergyChart() {
  const params = useParams();
  const [data, setData] = useState<EnergyKuchen | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadSharedData = () => {
      try {
        if (!params.data || typeof params.data !== 'string') {
          throw new Error('Ungültige Sharing-Daten');
        }

        const decodedData = SharingManager.decodeShareData(params.data);
        setData(decodedData);
      } catch (err) {
        console.error('Failed to decode shared data:', err);
        setError('Diese Sharing-URL ist ungültig oder beschädigt.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSharedData();
  }, [params.data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Energiekuchen wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Energiekuchen nicht gefunden
          </h1>
          <p className="text-gray-600 mb-6">
            {error || 'Diese Sharing-URL ist ungültig oder beschädigt.'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-yellow-400 text-gray-900 font-medium rounded-md hover:bg-yellow-500 transition-colors"
          >
            Eigenen Energiekuchen erstellen
          </Link>
        </div>
      </div>
    );
  }

  const { positiveTotal, negativeTotal, balance } = 
    getEnergyBalance(data.positive, data.negative);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🥧</div>
              <h1 className="text-xl font-bold text-gray-900">
                Geteilter Energiekuchen
              </h1>
            </div>
            <Link
              href="/"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 transition-colors"
            >
              Eigenen erstellen
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Energy Balance Summary */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Energiebilanz
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {positiveTotal}
              </div>
              <div className="text-sm text-green-700">
                Energiequellen
              </div>
            </div>
            
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {negativeTotal}
              </div>
              <div className="text-sm text-red-700">
                Energieverbraucher
              </div>
            </div>
            
            <div className={`text-center p-4 rounded-lg ${
              balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
            }`}>
              <div className={`text-2xl font-bold ${
                balance >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {balance >= 0 ? '+' : ''}{balance}
              </div>
              <div className={`text-sm ${
                balance >= 0 ? 'text-blue-700' : 'text-orange-700'
              }`}>
                Energiebilanz
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-center text-sm text-gray-600">
            {balance > 0 && (
              <p className="text-green-600">
                ✅ Energieüberschuss von {balance} Punkten
              </p>
            )}
            {balance === 0 && (
              <p className="text-blue-600">
                ⚖️ Perfekt ausbalancierte Energie
              </p>
            )}
            {balance < 0 && (
              <p className="text-orange-600">
                ⚠️ Energiedefizit von {Math.abs(balance)} Punkten
              </p>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
          {/* Positive Energy Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                <span className="text-2xl">⚡</span>
                Energiequellen
              </h2>
              {data.positive.activities.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {data.positive.activities.length} Aktivität{data.positive.activities.length !== 1 ? 'en' : ''}
                </p>
              )}
            </div>

            <EnergyChart
              chartType="positive"
              className="mb-6"
            />
            
            <ChartLegend
              activities={data.positive.activities}
            />
          </div>

          {/* Negative Energy Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                <span className="text-2xl">🔋</span>
                Energieverbraucher
              </h2>
              {data.negative.activities.length > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  {data.negative.activities.length} Aktivität{data.negative.activities.length !== 1 ? 'en' : ''}
                </p>
              )}
            </div>

            <EnergyChart
              chartType="negative"
              className="mb-6"
            />
            
            <ChartLegend
              activities={data.negative.activities}
            />
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🥧</div>
            <h3 className="text-lg font-medium text-yellow-800 mb-2">
              Gefällt dir dieser Energiekuchen?
            </h3>
            <p className="text-yellow-700 mb-4">
              Erstelle deinen eigenen Energiekuchen und teile ihn mit anderen!
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-yellow-400 text-gray-900 font-medium rounded-md hover:bg-yellow-500 transition-colors"
            >
              Jetzt starten
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
