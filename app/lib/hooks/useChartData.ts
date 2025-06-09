'use client';

import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { calculatePercentage, calculateTotalEnergy } from '@/app/lib/utils/calculations';
import { ChartData } from '@/app/types/chart';
import { useMemo } from 'react';

export function useChartData(chartType: 'positive' | 'negative') {
  const { state } = useEnergy();
  const chart = state.data[chartType];

  const chartData: ChartData = useMemo(() => {
    if (chart.activities.length === 0) {
      return {
        labels: ['Keine Aktivitäten'],
        datasets: [
          {
            data: [1],
            backgroundColor: ['oklch(0.928 0.006 264.531)'], // gray-200
            borderColor: ['#fff'],
            borderWidth: 2,
            hoverBackgroundColor: ['oklch(0.967 0.003 264.542)'], // gray-100
            hoverBorderColor: ['oklch(0.707 0.022 261.325)'], // gray-400
          },
        ],
      };
    }

    const total = calculateTotalEnergy(chart.activities);

    return {
      labels: chart.activities.map(activity => `${activity.name} (${calculatePercentage(activity.value, total)}%)`),
      datasets: [
        {
          data: chart.activities.map(activity => activity.value),
          backgroundColor: chart.activities.map(activity => activity.color),
          borderColor: chart.activities.map(() => '#fff'),
          borderWidth: 2,
          // Use CSS relative color syntax to create hover effect with reduced opacity
          hoverBackgroundColor: chart.activities.map(activity => `oklch(from ${activity.color} l c h / 0.8)`),
          hoverBorderColor: chart.activities.map(activity => activity.color),
        },
      ],
    };
  }, [chart.activities]);

  return { chartData, activities: chart.activities, size: chart.size };
}
