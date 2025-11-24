'use client';

import { getColorForLevel } from '@/app/lib/utils/constants';
import { Activity, ChartType } from '@/app/types';
import { ChartData } from '@/app/types/chart';
import { useMemo } from 'react';

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
            hoverBorderColor: ['#fff'], // Keep border white on hover
          },
        ],
      };
    }

    return {
      labels: activities.map(activity => activity.name),
      datasets: [
        {
          data: activities.map(activity => {
            const absValue = Math.abs(activity.value);
            return Math.pow(2, absValue - 1);
          }),
          backgroundColor: activities.map(activity => getColorForLevel(activity.value)),
          borderColor: activities.map(activity => {
            // Check if this activity is being edited
            const isActive = editingActivity?.chartType === chartType && editingActivity?.activityId === activity.id;
            if (isActive) {
              const baseColor = getColorForLevel(activity.value);
              return `oklch(from ${baseColor} calc(l - 0.1) c h)`; // 10% darker
            }
            return '#fff';
          }),
          borderWidth: 2,
          hoverBackgroundColor: activities.map(activity => {
            const color = getColorForLevel(activity.value);
            return `oklch(from ${color} calc(l + 0.1) c h)`; // 10% lighter
          }),
          hoverBorderColor: activities.map(activity => {
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
  }, [activities, chartType, editingActivity]);

  return { chartData, activities };
}
