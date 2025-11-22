'use client';

import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { ChartData } from '@/app/types/chart';
import { useMemo } from 'react';

export function useChartData(chartType: 'current' | 'desired', editingActivity: { chartType: 'current' | 'desired'; activityId: string } | null) {
  const { state } = useEnergy();
  const chart = state.data[chartType];

  const chartData: ChartData = useMemo(() => {
    if (chart.activities.length === 0) {
      const emptyChartColor = 'oklch(0.967 0.003 264.542)'; // gray-100

      return {
        labels: ['Keine Aktivitäten'],
        datasets: [
          {
            data: [1],
            backgroundColor: [emptyChartColor],
            borderColor: ['#fff'],
            borderWidth: 2,
            hoverBackgroundColor: ['oklch(0.985 0.002 247.839)'], // gray-50
            hoverBorderColor: ['#fff'], // Keep border white on hover
          },
        ],
      };
    }

    return {
      labels: chart.activities.map(activity => activity.name),
      datasets: [
        {
          data: chart.activities.map(activity => Math.abs(activity.value)),
          backgroundColor: chart.activities.map(activity => getColorForLevel(activity.value)),
          borderColor: chart.activities.map(activity => {
            // Check if this activity is being edited
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForLevel(activity.value);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`; // 10% darker
            }
            return '#fff';
          }),
          borderWidth: 2,
          hoverBackgroundColor: chart.activities.map(activity => {
            const color = getColorForLevel(activity.value);
            return `oklch(from ${color} calc(l + 0.1) c h)`; // 10% lighter
          }),
          hoverBorderColor: chart.activities.map(activity => {
            // Keep the same border color on hover as the regular state
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForLevel(activity.value);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`; // 10% darker
            }
            return '#fff';
          }),
        },
      ],
    };
  }, [chart.activities, chartType, editingActivity]);

  return { chartData, activities: chart.activities };
}
