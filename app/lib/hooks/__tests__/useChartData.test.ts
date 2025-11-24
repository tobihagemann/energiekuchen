import { useChartData } from '@/app/lib/hooks/useChartData';
import { Activity } from '@/app/types';
import { renderHook } from '@testing-library/react';

describe('useChartData', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Activity 1',
      value: 3,
    },
    {
      id: '2',
      name: 'Activity 2',
      value: 4,
    },
  ];

  it('should return chart data for positive chart with activities', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'current', null));

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.chartData.labels).toEqual(['Activity 1', 'Activity 2']);
    expect(result.current.chartData.datasets[0].data).toEqual([4, 8]); // Exponential: 2^(3-1)=4, 2^(4-1)=8
    // backgroundColor should now be based on energy levels, not the removed color property
  });

  it('should return chart data for negative chart with activities', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'desired', null));

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.chartData.labels).toEqual(['Activity 1', 'Activity 2']);
  });

  it('should return empty state chart data when no activities', () => {
    // Test current chart empty state
    const { result: currentResult } = renderHook(() => useChartData([], 'current', null));

    expect(currentResult.current.activities).toEqual([]);
    expect(currentResult.current.chartData.labels).toEqual(['Keine Aktivitäten']);
    expect(currentResult.current.chartData.datasets[0].data).toEqual([1]);
    expect(currentResult.current.chartData.datasets[0].backgroundColor).toEqual(['oklch(0.967 0.003 264.542)']); // gray-100
    expect(currentResult.current.chartData.datasets[0].hoverBackgroundColor).toEqual(['oklch(0.985 0.002 247.839)']); // gray-50
    expect(currentResult.current.chartData.datasets[0].hoverBorderColor).toEqual(['#fff']); // white on hover

    // Test desired chart empty state (same as current)
    const { result: desiredResult } = renderHook(() => useChartData([], 'desired', null));

    expect(desiredResult.current.activities).toEqual([]);
    expect(desiredResult.current.chartData.labels).toEqual(['Keine Aktivitäten']);
    expect(desiredResult.current.chartData.datasets[0].data).toEqual([1]);
    expect(desiredResult.current.chartData.datasets[0].backgroundColor).toEqual(['oklch(0.967 0.003 264.542)']); // gray-100
    expect(desiredResult.current.chartData.datasets[0].hoverBackgroundColor).toEqual(['oklch(0.985 0.002 247.839)']); // gray-50
    expect(desiredResult.current.chartData.datasets[0].hoverBorderColor).toEqual(['#fff']); // white on hover
  });

  it('should include hover effects in chart data', () => {
    const { result } = renderHook(() => useChartData(mockActivities, 'current', null));

    const dataset = result.current.chartData.datasets[0];
    expect(dataset.borderWidth).toBe(2);
    // Hover colors now depend on energy levels
    expect(dataset.hoverBackgroundColor).toBeDefined();
    expect(dataset.hoverBorderColor).toBeDefined();
    // hoverBorderColor should match regular borderColor
    expect(dataset.hoverBorderColor).toEqual(dataset.borderColor);
  });

  it('should handle single activity', () => {
    const singleActivity = [mockActivities[0]];

    const { result } = renderHook(() => useChartData(singleActivity, 'current', null));

    expect(result.current.chartData.labels).toEqual(['Activity 1']);
    expect(result.current.chartData.datasets[0].data).toEqual([4]); // Exponential: 2^(3-1)=4
  });

  it("should memoize chart data when activities don't change", () => {
    const { result, rerender } = renderHook(() => useChartData(mockActivities, 'current', null));

    const firstChartData = result.current.chartData;

    rerender();

    const secondChartData = result.current.chartData;

    expect(firstChartData).toBe(secondChartData); // Same reference due to memoization
  });

  it('should update chart data when activities change', () => {
    // First render with mock activities
    const { result, rerender } = renderHook(({ activities }) => useChartData(activities, 'current', null), {
      initialProps: { activities: mockActivities },
    });

    const firstChartData = result.current.chartData;

    // Second render with different activities
    const newActivities: Activity[] = [
      {
        id: '3',
        name: 'New Activity',
        value: 5,
      },
    ];

    rerender({ activities: newActivities });

    const secondChartData = result.current.chartData;

    expect(firstChartData).not.toBe(secondChartData); // Different reference
    expect(result.current.chartData.labels).toEqual(['New Activity']);
  });

  it('should apply active border color to edited activity', () => {
    // Test with no editing activity
    const { result: result1 } = renderHook(() => useChartData(mockActivities, 'current', null));
    const dataset1 = result1.current.chartData.datasets[0];
    expect(dataset1.borderColor).toEqual(['#fff', '#fff']); // All white borders

    // Test with editing activity
    const editingActivity = { chartType: 'current' as const, activityId: '1' };
    const { result: result2 } = renderHook(() => useChartData(mockActivities, 'current', editingActivity));
    const dataset2 = result2.current.chartData.datasets[0];
    // First activity (level 3) should have darkened border (10% darker), second should be white
    expect(dataset2.borderColor[0]).toBe('oklch(from oklch(0.723 0.219 149.579) calc(l - 0.1) c h)'); // green-500 darkened
    expect(dataset2.borderColor[1]).toBe('#fff');

    // Test with different chart type
    const editingActivityNegative = { chartType: 'desired' as const, activityId: '1' };
    const { result: result3 } = renderHook(() => useChartData(mockActivities, 'current', editingActivityNegative));
    const dataset3 = result3.current.chartData.datasets[0];
    expect(dataset3.borderColor).toEqual(['#fff', '#fff']); // All white borders since editing is on different chart
  });

  it('should use OKLCH color manipulation for active borders and hover states', () => {
    // Test with level 1 activity
    const level1Activity = [{ id: '1', name: 'Low Energy', value: 1 }];

    const editingActivity = { chartType: 'current' as const, activityId: '1' };
    const { result } = renderHook(() => useChartData(level1Activity, 'current', editingActivity));
    // Level 1 activity should get darkened border
    expect(result.current.chartData.datasets[0].borderColor[0]).toBe('oklch(from oklch(0.871 0.15 154.449) calc(l - 0.1) c h)'); // green-300 darkened
    // Hover background should be lightened
    expect(result.current.chartData.datasets[0].hoverBackgroundColor[0]).toBe('oklch(from oklch(0.871 0.15 154.449) calc(l + 0.1) c h)'); // green-300 lightened

    // Test with level 5 activity
    const level5Activity = [{ id: '2', name: 'High Energy', value: 5 }];

    const editingActivity2 = { chartType: 'current' as const, activityId: '2' };
    const { result: result2 } = renderHook(() => useChartData(level5Activity, 'current', editingActivity2));
    // Level 5 activity should get darkened border
    expect(result2.current.chartData.datasets[0].borderColor[0]).toBe('oklch(from oklch(0.527 0.154 150.069) calc(l - 0.1) c h)'); // green-700 darkened
  });
});
