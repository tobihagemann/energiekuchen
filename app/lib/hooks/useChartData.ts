'use client';

import { useMemo } from 'react';

import { getColorForPolarity } from '@/app/lib/utils/constants';
import { Activity, ChartType } from '@/app/types';
import { ChartData } from '@/app/types/chart';

export function useChartData(activities: Activity[], chartType: ChartType, editingActivity: { chartType: ChartType; activityId: string } | null) {
  const chartData: ChartData = useMemo(() => {
    if (activities.length === 0) {
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
            hoverBorderColor: ['#fff'],
          },
        ],
      };
    }

    return {
      labels: activities.map(activity => activity.name),
      datasets: [
        {
          data: activities.map(activity => activity.weight),
          backgroundColor: activities.map(activity => getColorForPolarity(activity.polarity)),
          borderColor: activities.map(activity => {
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForPolarity(activity.polarity);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`;
            }
            return '#fff';
          }),
          borderWidth: 2,
          hoverBackgroundColor: activities.map(activity => {
            const color = getColorForPolarity(activity.polarity);
            return `oklch(from ${color} calc(l + 0.1) c h)`;
          }),
          hoverBorderColor: activities.map(activity => {
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForPolarity(activity.polarity);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`;
            }
            return '#fff';
          }),
        },
      ],
    };
  }, [activities, chartType, editingActivity]);

  return { chartData, activities };
}
