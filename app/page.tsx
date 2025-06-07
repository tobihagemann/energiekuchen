'use client';

import { EnergyChart } from '@/app/components/charts/EnergyChart';
import { ActivityList } from '@/app/components/features/ActivityList';
import { HelpModal } from '@/app/components/features/HelpModal';
import { ImportExportModal } from '@/app/components/features/ImportExportModal';
import { ShareModal } from '@/app/components/features/ShareModal';
import { Header } from '@/app/components/layout/Header';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { getEnergyBalance } from '@/app/lib/utils/calculations';

export default function Dashboard() {
  const { state } = useEnergy();
  const { setEditingActivity } = useUI();
  const { isMobile } = useResponsive();

  const { positiveTotal, negativeTotal, balance } = getEnergyBalance(state.data.positive, state.data.negative);

  const handleActivityClick = (chartType: 'positive' | 'negative') => (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  if (state.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" data-testid="loading-spinner">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Energiekuchen wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

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

          {positiveTotal > 0 || negativeTotal > 0 ? (
            <div className="mt-4 text-center text-sm text-gray-600" data-testid="energy-balance-message">
              {balance > 0 && <p className="text-green-600">✅ Du hast einen Energieüberschuss von {balance} Punkten!</p>}
              {balance === 0 && <p className="text-blue-600">⚖️ Deine Energie ist perfekt ausbalanciert!</p>}
              {balance < 0 && <p className="text-orange-600">⚠️ Du hast ein Energiedefizit von {Math.abs(balance)} Punkten.</p>}
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-500" data-testid="energy-balance-empty">
              Fügen Sie Aktivitäten hinzu, um Ihre Energiebilanz zu sehen.
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`} data-testid="charts-section">
          {/* Positive Energy Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm" data-testid="positive-energy-section">
            <EnergyChart chartType="positive" onActivityClick={handleActivityClick('positive')} className="mb-6" />

            <ActivityList chartType="positive" activities={state.data.positive.activities} />
          </div>

          {/* Negative Energy Chart */}
          <div className="rounded-lg bg-white p-6 shadow-sm" data-testid="negative-energy-section">
            <EnergyChart chartType="negative" onActivityClick={handleActivityClick('negative')} className="mb-6" />

            <ActivityList chartType="negative" activities={state.data.negative.activities} />
          </div>
        </div>

        {/* Getting Started Help */}
        {positiveTotal === 0 && negativeTotal === 0 && (
          <div className="mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6" data-testid="getting-started-help">
            <div className="text-center">
              <div className="mb-4 text-4xl">🥧</div>
              <h3 className="mb-2 text-lg font-medium text-yellow-800">Willkommen bei Energiekuchen!</h3>
              <p className="mb-4 text-yellow-700">Beginnen Sie damit, Ihre ersten Aktivitäten hinzuzufügen:</p>
              <div className="grid grid-cols-1 gap-4 text-sm text-yellow-700 md:grid-cols-2">
                <div>
                  <strong>⚡ Energiequellen:</strong>
                  <br />
                  Aktivitäten, die dir Energie geben
                  <br />
                  <em>z.B. Sport, Entspannung, Zeit mit Freunden</em>
                </div>
                <div>
                  <strong>🔋 Energieverbraucher:</strong>
                  <br />
                  Aktivitäten, die dir Energie nehmen
                  <br />
                  <em>z.B. Überstunden, Stress, schwierige Gespräche</em>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <ShareModal />
      <ImportExportModal />
      <HelpModal />
    </div>
  );
}
