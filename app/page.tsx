'use client';

import { EnergyChart } from '@/app/components/charts/EnergyChart';
import { ActivityList } from '@/app/components/features/ActivityList';
import { ImportExportModal } from '@/app/components/features/ImportExportModal';
import { ShareModal } from '@/app/components/features/ShareModal';
import { Header } from '@/app/components/layout/Header';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
export default function Dashboard() {
  const { state } = useEnergy();
  const { setEditingActivity } = useUI();
  const { isMobile } = useResponsive();

  const handleActivityClick = (chartType: 'positive' | 'negative') => (activityId: string) => {
    setEditingActivity({ chartType, activityId });
  };

  if (state.isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center" data-testid="loading-spinner">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400"></div>
          <p className="mt-4 text-gray-600">Energiekuchen wird geladen...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
        </div>
      </main>

      <ShareModal />
      <ImportExportModal />
    </div>
  );
}
