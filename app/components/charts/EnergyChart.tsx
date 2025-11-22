'use client';

import { useUI } from '@/app/lib/contexts/UIContext';
import { useChartData } from '@/app/lib/hooks/useChartData';
import { useResponsive } from '@/app/lib/hooks/useResponsive';
import { cn } from '@/app/lib/utils/cn';
import { ChartType } from '@/app/types';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { useRef } from 'react';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

interface EnergyChartProps {
  chartType: ChartType;
  className?: string;
  onActivityClick?: (activityId: string) => void;
}

export function EnergyChart({ chartType, className, onActivityClick }: EnergyChartProps) {
  const { state: uiState } = useUI();
  const { chartData, activities } = useChartData(chartType, uiState.editingActivity);
  const { isSmall, isMedium } = useResponsive();
  const chartRef = useRef<ChartJS<'pie'>>(null);

  // Fixed responsive chart sizes
  const chartSize = isSmall ? 280 : isMedium ? 360 : 440;

  // Determine label color based on activity value (absolute value)
  // Values 1-2 use lighter backgrounds (300-400), need dark text
  // Values 3-5 use darker backgrounds (500-700), need white text
  const getLabelColor = (value: number): string => {
    const absValue = Math.abs(value);
    if (absValue >= 3) {
      return '#fff'; // white for dark backgrounds
    }
    // Dark green for positive, dark red for negative (using oklch)
    return value > 0 ? 'oklch(0.393 0.095 152.535)' : 'oklch(0.396 0.141 25.723)'; // green-900 : red-900
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    borderAlign: 'inner' as const,
    plugins: {
      legend: {
        display: false, // We'll create our own legend
      },
      tooltip: {
        enabled: false,
      },
      datalabels: {
        display: () => {
          // Don't show label for empty state
          return activities.length > 0;
        },
        color: (context: { dataIndex: number }) => {
          const activity = activities[context.dataIndex];
          return activity ? getLabelColor(activity.value) : '#fff';
        },
        font: {
          size: isSmall ? 12 : isMedium ? 14 : 16,
          weight: 'bold' as const,
        },
        formatter: (value: number, context: { dataIndex: number }) => {
          const activity = activities[context.dataIndex];
          if (!activity) return '';
          return activity.name;
        },
        anchor: 'center' as const,
        align: 'center' as const,
        clip: true,
        textAlign: 'center' as const,
        padding: 4,
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

  const title = chartType === 'current' ? 'Ist-Zustand' : 'Wunsch-Zustand';
  const subtitle = chartType === 'current' ? 'Deine aktuelle Energiesituation' : 'Deine gewünschte Energiesituation';
  const icon = chartType === 'current' ? '📍' : '🎯';

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
