'use client';

import { useChartData } from '@/app/lib/hooks/useChartData';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { cn } from '@/app/lib/utils/cn';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { useRef } from 'react';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EnergyChartProps {
  chartType: 'positive' | 'negative';
  className?: string;
  onActivityClick?: (activityId: string) => void;
}

export function EnergyChart({ chartType, className, onActivityClick }: EnergyChartProps) {
  const { chartData, activities } = useChartData(chartType);
  const { isSmall, isMedium } = useResponsive();
  const chartRef = useRef<ChartJS<'pie'>>(null);

  // Fixed responsive chart sizes
  const chartSize = isSmall ? 280 : isMedium ? 360 : 440;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    borderAlign: 'inner',
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
    animation: {
      duration: 300,
    },
  };

  const title = chartType === 'positive' ? 'Energiequellen' : 'Energieverbraucher';
  const subtitle = chartType === 'positive' ? 'Aktivitäten, die dir Energie geben' : 'Aktivitäten, die dir Energie nehmen';
  const icon = chartType === 'positive' ? '⚡' : '🔋';

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="mb-4 text-center">
        <h2 className="flex items-center justify-center gap-2 text-xl font-semibold text-gray-900">
          <span className="text-2xl">{icon}</span>
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
      </div>

      <div className="relative" style={{ width: chartSize, height: chartSize }}>
        <Pie ref={chartRef} data={chartData} options={options} />
      </div>
    </div>
  );
}
