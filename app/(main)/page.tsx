'use client';

import { EnergyChart } from '@/app/components/charts/EnergyChart';
import { ActivityList } from '@/app/components/features/ActivityList';
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

  const { positiveTotal, negativeTotal, balance } = 
    getEnergyBalance(state.data.positive, state.data.negative);

  const handleActivityClick = (chartType: 'positive' | 'negative') => (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-600">Energiekuchen wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
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
          
          {positiveTotal > 0 || negativeTotal > 0 ? (
            <div className="mt-4 text-center text-sm text-gray-600">
              {balance > 0 && (
                <p className="text-green-600">
                  ✅ Du hast einen Energieüberschuss von {balance} Punkten!
                </p>
              )}
              {balance === 0 && (
                <p className="text-blue-600">
                  ⚖️ Deine Energie ist perfekt ausbalanciert!
                </p>
              )}
              {balance < 0 && (
                <p className="text-orange-600">
                  ⚠️ Du hast ein Energiedefizit von {Math.abs(balance)} Punkten.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 text-center text-sm text-gray-500">
              Fügen Sie Aktivitäten hinzu, um Ihre Energiebilanz zu sehen.
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className={`grid gap-8 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Positive Energy Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <EnergyChart
              chartType="positive"
              onActivityClick={handleActivityClick('positive')}
              className="mb-6"
            />
            
            <ActivityList
              chartType="positive"
              activities={state.data.positive.activities}
            />
          </div>

          {/* Negative Energy Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <EnergyChart
              chartType="negative"
              onActivityClick={handleActivityClick('negative')}
              className="mb-6"
            />
            
            <ActivityList
              chartType="negative"
              activities={state.data.negative.activities}
            />
          </div>
        </div>

        {/* Getting Started Help */}
        {positiveTotal === 0 && negativeTotal === 0 && (
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🥧</div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                Willkommen bei Energiekuchen!
              </h3>
              <p className="text-yellow-700 mb-4">
                Beginnen Sie damit, Ihre ersten Aktivitäten hinzuzufügen:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-700">
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
    </div>
  );
}
