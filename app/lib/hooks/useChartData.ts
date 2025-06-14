'use client';

import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { ChartData } from '@/app/types/chart';
import { useMemo } from 'react';

export function useChartData(chartType: 'positive' | 'negative') {
  const { state } = useEnergy();
  const chart = state.data[chartType];

  const chartData: ChartData = useMemo(() => {
    if (chart.activities.length === 0) {
      const emptyChartColors = {
        positive: {
          backgroundColor: 'oklch(0.962 0.044 156.743)', // green-100
          hoverBackgroundColor: 'oklch(0.982 0.018 155.826)', // green-50
          hoverBorderColor: 'oklch(0.962 0.044 156.743)', // green-100
        },
        negative: {
          backgroundColor: 'oklch(0.936 0.032 17.717)', // red-100
          hoverBackgroundColor: 'oklch(0.971 0.013 17.38)', // red-50
          hoverBorderColor: 'oklch(0.936 0.032 17.717)', // red-100
        },
      };

      const colors = emptyChartColors[chartType];

      return {
        labels: ['Keine Aktivitäten'],
        datasets: [
          {
            data: [1],
            backgroundColor: [colors.backgroundColor],
            borderColor: ['#fff'],
            borderWidth: 2,
            hoverBackgroundColor: [colors.hoverBackgroundColor],
            hoverBorderColor: [colors.hoverBorderColor],
          },
        ],
      };
    }

    return {
      labels: chart.activities.map(activity => activity.name),
      datasets: [
        {
          data: chart.activities.map(activity => activity.value),
          backgroundColor: chart.activities.map(activity => getColorForLevel(activity.value, chartType)),
          borderColor: chart.activities.map(() => '#fff'),
          borderWidth: 2,
          hoverBackgroundColor: chart.activities.map(activity => {
            const color = getColorForLevel(activity.value, chartType);
            return `oklch(from ${color} l c h / 0.8)`;
          }),
          hoverBorderColor: chart.activities.map(activity => getColorForLevel(activity.value, chartType)),
        },
      ],
    };
  }, [chart.activities, chartType]);

  return { chartData, activities: chart.activities };
}
