import { renderHook } from '@testing-library/react';

import { useChartData } from '@/app/lib/hooks/useChartData';
import { NEGATIVE_COLOR, POSITIVE_COLOR } from '@/app/lib/utils/constants';
import { Activity } from '@/app/types';

describe('useChartData', () => {
  const mockActivities: Activity[] = [
    { id: '1', name: 'Activity 1', weight: 4, polarity: 'positive' },
    { id: '2', name: 'Activity 2', weight: 8, polarity: 'negative' },
  ];

  it('maps weight directly to dataset data', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'current', null));
    expect(result.current.chartData.datasets[0].data).toEqual([4, 8]);
    expect(result.current.chartData.labels).toEqual(['Activity 1', 'Activity 2']);
  });

  it('colors slices by polarity', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'current', null));
    expect(result.current.chartData.datasets[0].backgroundColor).toEqual([POSITIVE_COLOR, NEGATIVE_COLOR]);
  });

  it('returns the empty-state palette when no activities', () => {
    const { result } = renderHook(() => useChartData([], 'current', null));
    expect(result.current.chartData.labels).toEqual(['Keine Aktivitäten']);
    expect(result.current.chartData.datasets[0].data).toEqual([1]);
    expect(result.current.chartData.datasets[0].backgroundColor).toEqual(['oklch(0.967 0.003 264.542)']);
  });

  it('memoizes when activities are stable', () => {
    const { result, rerender } = renderHook(() => useChartData(mockActivities, 'current', null));
    const first = result.current.chartData;
    rerender();
    expect(result.current.chartData).toBe(first);
  });

  it('applies darkened border for active editing activity', () => {
    const editing = { chartType: 'current' as const, activityId: '1' };
    const { result } = renderHook(() => useChartData(mockActivities, 'current', editing));
    expect(result.current.chartData.datasets[0].borderColor[0]).toBe(`oklch(from ${POSITIVE_COLOR} calc(l - 0.1) c h)`);
    expect(result.current.chartData.datasets[0].borderColor[1]).toBe('#fff');
  });

  it('applies lightened hover color', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'current', null));
    expect(result.current.chartData.datasets[0].hoverBackgroundColor[0]).toBe(`oklch(from ${POSITIVE_COLOR} calc(l + 0.1) c h)`);
    expect(result.current.chartData.datasets[0].hoverBackgroundColor[1]).toBe(`oklch(from ${NEGATIVE_COLOR} calc(l + 0.1) c h)`);
  });

  it('updates dataset when activities change', () => {
    const { result, rerender } = renderHook(({ activities }) => useChartData(activities, 'current', null), {
      initialProps: { activities: mockActivities },
    });
    const before = result.current.chartData;
    rerender({ activities: [{ id: '3', name: 'New', weight: 5, polarity: 'positive' }] });
    expect(result.current.chartData).not.toBe(before);
    expect(result.current.chartData.labels).toEqual(['New']);
  });

  it('does not apply active border when editing is on a different chart', () => {
    const editing = { chartType: 'desired' as const, activityId: '1' };
    const { result } = renderHook(() => useChartData(mockActivities, 'current', editing));
    expect(result.current.chartData.datasets[0].borderColor).toEqual(['#fff', '#fff']);
  });

  it('hoverBorderColor for active editing activity matches darkened border', () => {
    const editing = { chartType: 'current' as const, activityId: '1' };
    const { result } = renderHook(() => useChartData(mockActivities, 'current', editing));
    expect(result.current.chartData.datasets[0].hoverBorderColor?.[0]).toBe(`oklch(from ${POSITIVE_COLOR} calc(l - 0.1) c h)`);
    expect(result.current.chartData.datasets[0].hoverBorderColor?.[1]).toBe('#fff');
  });
});
