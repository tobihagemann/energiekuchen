import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useChartData } from '@/app/lib/hooks/useChartData';
import * as calculations from '@/app/lib/utils/calculations';
import { Activity } from '@/app/types';
import { renderHook } from '@testing-library/react';

// Mock dependencies
jest.mock('@/app/lib/contexts/EnergyContext');
jest.mock('@/app/lib/utils/calculations');

const mockUseEnergy = useEnergy as jest.MockedFunction<typeof useEnergy>;

describe('useChartData', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Activity 1',
      value: 6,
      color: '#FF5733',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Activity 2',
      value: 4,
      color: '#33FF57',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    // Mock calculations
    const mockedCalculations = calculations as jest.Mocked<typeof calculations>;
    mockedCalculations.calculateTotalEnergy.mockImplementation((activities: Activity[]) => activities.reduce((sum, activity) => sum + activity.value, 0));
    mockedCalculations.calculatePercentage.mockImplementation((value: number, total: number) => Math.round((value / total) * 100));
  });

  it('should return chart data for positive chart with activities', () => {
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: mockActivities,
            size: 'small',
          },
          negative: {
            activities: [],
            size: 'small',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useChartData('positive'));

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.size).toBe('small');
    expect(result.current.chartData.labels).toEqual(['Activity 1 (60%)', 'Activity 2 (40%)']);
    expect(result.current.chartData.datasets[0].data).toEqual([6, 4]);
    expect(result.current.chartData.datasets[0].backgroundColor).toEqual(['#FF5733', '#33FF57']);
  });

  it('should return chart data for negative chart with activities', () => {
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: [],
            size: 'small',
          },
          negative: {
            activities: mockActivities,
            size: 'medium',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useChartData('negative'));

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.size).toBe('medium');
    expect(result.current.chartData.labels).toEqual(['Activity 1 (60%)', 'Activity 2 (40%)']);
  });

  it('should return empty state chart data when no activities', () => {
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: [],
            size: 'small',
          },
          negative: {
            activities: [],
            size: 'small',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    // Test positive chart empty state
    const { result: positiveResult } = renderHook(() => useChartData('positive'));

    expect(positiveResult.current.activities).toEqual([]);
    expect(positiveResult.current.chartData.labels).toEqual(['Keine Aktivitäten']);
    expect(positiveResult.current.chartData.datasets[0].data).toEqual([1]);
    expect(positiveResult.current.chartData.datasets[0].backgroundColor).toEqual(['oklch(0.962 0.044 156.743)']); // green-100

    // Test negative chart empty state
    const { result: negativeResult } = renderHook(() => useChartData('negative'));

    expect(negativeResult.current.activities).toEqual([]);
    expect(negativeResult.current.chartData.labels).toEqual(['Keine Aktivitäten']);
    expect(negativeResult.current.chartData.datasets[0].data).toEqual([1]);
    expect(negativeResult.current.chartData.datasets[0].backgroundColor).toEqual(['oklch(0.936 0.032 17.717)']); // red-100
  });

  it('should include hover effects in chart data', () => {
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: mockActivities,
            size: 'large',
          },
          negative: {
            activities: [],
            size: 'large',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useChartData('positive'));

    const dataset = result.current.chartData.datasets[0];
    expect(dataset.borderWidth).toBe(2);
    // Hover colors use CSS relative color syntax with reduced opacity
    expect(dataset.hoverBackgroundColor).toEqual([
      'oklch(from #FF5733 l c h / 0.8)',
      'oklch(from #33FF57 l c h / 0.8)'
    ]);
    expect(dataset.hoverBorderColor).toEqual(['#FF5733', '#33FF57']);
  });

  it('should handle single activity', () => {
    const singleActivity = [mockActivities[0]];

    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: singleActivity,
            size: 'medium',
          },
          negative: {
            activities: [],
            size: 'medium',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result } = renderHook(() => useChartData('positive'));

    expect(result.current.chartData.labels).toEqual(['Activity 1 (100%)']);
    expect(result.current.chartData.datasets[0].data).toEqual([6]);
  });

  it("should memoize chart data when activities don't change", () => {
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: mockActivities,
            size: 'small',
          },
          negative: {
            activities: [],
            size: 'small',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const { result, rerender } = renderHook(() => useChartData('positive'));

    const firstChartData = result.current.chartData;

    rerender();

    const secondChartData = result.current.chartData;

    expect(firstChartData).toBe(secondChartData); // Same reference due to memoization
  });

  it('should update chart data when activities change', () => {
    const { result, rerender } = renderHook(() => useChartData('positive'));

    // First render with mock activities
    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: mockActivities,
            size: 'medium',
          },
          negative: {
            activities: [],
            size: 'medium',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    rerender();

    const firstChartData = result.current.chartData;

    // Second render with different activities
    const newActivities: Activity[] = [
      {
        id: '3',
        name: 'New Activity',
        value: 10,
        color: '#123456',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    mockUseEnergy.mockReturnValue({
      state: {
        data: {
          positive: {
            activities: newActivities,
            size: 'large',
          },
          negative: {
            activities: [],
            size: 'large',
          },
        },
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    rerender();

    const secondChartData = result.current.chartData;

    expect(firstChartData).not.toBe(secondChartData); // Different reference
    expect(result.current.chartData.labels).toEqual(['New Activity (100%)']);
  });
});
