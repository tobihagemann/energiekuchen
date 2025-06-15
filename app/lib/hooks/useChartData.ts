'use client';

import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { getColorForLevel } from '@/app/lib/utils/constants';
import { ChartData } from '@/app/types/chart';
import { useMemo } from 'react';

export function useChartData(chartType: 'positive' | 'negative', editingActivity: { chartType: 'positive' | 'negative'; activityId: string } | null) {
  const { state } = useEnergy();
  const chart = state.data[chartType];

  const chartData: ChartData = useMemo(() => {
    if (chart.activities.length === 0) {
      const emptyChartColors = {
        positive: 'oklch(0.962 0.044 156.743)', // green-100
        negative: 'oklch(0.936 0.032 17.717)', // red-100
      };

      const backgroundColor = emptyChartColors[chartType];

      return {
        labels: ['Keine Aktivitäten'],
        datasets: [
          {
            data: [1],
            backgroundColor: [backgroundColor],
            borderColor: ['#fff'],
            borderWidth: 2,
            hoverBackgroundColor: [`oklch(from ${backgroundColor} calc(l + 0.1) c h)`], // 10% lighter
            hoverBorderColor: ['#fff'], // Keep border white on hover
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
          borderColor: chart.activities.map(activity => {
            // Check if this activity is being edited
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForLevel(activity.value, chartType);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`; // 10% darker
            }
            return '#fff';
          }),
          borderWidth: 2,
          hoverBackgroundColor: chart.activities.map(activity => {
            const color = getColorForLevel(activity.value, chartType);
            return `oklch(from ${color} calc(l + 0.1) c h)`; // 10% lighter
          }),
          hoverBorderColor: chart.activities.map(activity => {
            // Keep the same border color on hover as the regular state
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForLevel(activity.value, chartType);
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
