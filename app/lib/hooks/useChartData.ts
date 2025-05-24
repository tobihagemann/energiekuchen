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
        datasets: [{
          data: [1],
          backgroundColor: ['#E5E7EB'],
          borderColor: ['#D1D5DB'],
          borderWidth: 2,
          hoverBackgroundColor: ['#F3F4F6'],
          hoverBorderColor: ['#9CA3AF']
        }]
      };
    }

    const total = calculateTotalEnergy(chart.activities);
    
    return {
      labels: chart.activities.map(activity => 
        `${activity.name} (${calculatePercentage(activity.value, total)}%)`
      ),
      datasets: [{
        data: chart.activities.map(activity => activity.value),
        backgroundColor: chart.activities.map(activity => activity.color),
        borderColor: chart.activities.map(activity => activity.color),
        borderWidth: 2,
        hoverBackgroundColor: chart.activities.map(activity => activity.color + '80'),
        hoverBorderColor: chart.activities.map(activity => activity.color)
      }]
    };
  }, [chart.activities]);

  return { chartData, activities: chart.activities, size: chart.size };
}
