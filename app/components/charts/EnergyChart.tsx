'use client';

import { useChartData } from '@/app/lib/hooks/useChartData';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { getChartPixelSize } from '@/app/lib/utils/calculations';
import { cn } from '@/app/lib/utils/cn';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EnergyChartProps {
  chartType: 'positive' | 'negative';
  className?: string;
  onActivityClick?: (activityId: string) => void;
}

export function EnergyChart({ chartType, className, onActivityClick }: EnergyChartProps) {
  const { chartData, activities, size } = useChartData(chartType);
  const { isMobile } = useResponsive();
  const chartRef = useRef<ChartJS<'doughnut'>>(null);

  const chartSize = getChartPixelSize(size, isMobile);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll create our own legend
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context: { dataIndex: number }) => {
            const activity = activities[context.dataIndex];
            if (!activity) return '';
            return `${activity.name}: ${activity.value} Energie`;
          },
        },
      },
    },
    onClick: (event: unknown, elements: { index: number }[]) => {
      if (elements.length > 0 && onActivityClick) {
        const elementIndex = elements[0].index;
        const activity = activities[elementIndex];
        if (activity) {
          onActivityClick(activity.id);
        }
      }
    },
    cutout: '60%',
    animation: {
      duration: 300,
    },
  };

  const isEmpty = activities.length === 0;
  const title = chartType === 'positive' ? 'Energiequellen' : 'Energieverbraucher';
  const icon = chartType === 'positive' ? '⚡' : '🔋';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="mb-4 text-center">
        <h2 className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-900">
          <span className="text-2xl">{icon}</span>
          {title}
        </h2>
        {!isEmpty && (
          <p className="mt-1 text-sm text-gray-500">
            {activities.length} Aktivität{activities.length !== 1 ? 'en' : ''}
          </p>
        )}
      </div>

      <div className="relative" style={{ width: chartSize, height: chartSize }}>
        <Doughnut ref={chartRef} data={chartData} options={options} />

        {/* Center content */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            {isEmpty ? (
              <div className="text-gray-400">
                <div className="mb-1 text-2xl">➕</div>
                <div className="text-xs">Aktivität hinzufügen</div>
              </div>
            ) : (
              <div className="text-gray-700">
                <div className="text-lg font-semibold">{activities.reduce((sum, a) => sum + a.value, 0)}</div>
                <div className="text-xs">Gesamt</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
