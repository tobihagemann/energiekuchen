import { ChartLegend } from '@/app/components/charts/ChartLegend';
import { Activity } from '@/app/types';
import { fireEvent, render, screen } from '@testing-library/react';

// Mock the utils
jest.mock('@/app/lib/utils/calculations', () => ({
  calculatePercentage: jest.fn((value: number, total: number) => Math.round((value / total) * 100)),
  calculateTotalEnergy: jest.fn((activities: Activity[]) => 
    activities.reduce((sum, activity) => sum + activity.value, 0)
  ),
}));

describe('ChartLegend', () => {
  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Activity 1',
      value: 5,
      color: '#FF5733',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Activity 2',
      value: 3,
      color: '#33FF57',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Very Long Activity Name That Should Be Truncated',
      value: 2,
      color: '#3357FF',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('should render nothing when no activities', () => {
    const { container } = render(
      <ChartLegend activities={[]} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render all activities', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Activity 2')).toBeInTheDocument();
    expect(screen.getByText('Very Long Activity Name That Should Be Truncated')).toBeInTheDocument();
  });

  it('should display activity values', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should display percentages correctly', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    // Total is 10 (5+3+2), so percentages should be 50%, 30%, 20%
    expect(screen.getByText('(50%)')).toBeInTheDocument();
    expect(screen.getByText('(30%)')).toBeInTheDocument();
    expect(screen.getByText('(20%)')).toBeInTheDocument();
  });

  it('should display activity colors', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    const colorDivs = screen.getAllByRole('generic').filter(div => 
      div.className.includes('w-4 h-4 rounded-full')
    );

    expect(colorDivs).toHaveLength(3);
    expect(colorDivs[0]).toHaveStyle('background-color: #FF5733');
    expect(colorDivs[1]).toHaveStyle('background-color: #33FF57');
    expect(colorDivs[2]).toHaveStyle('background-color: #3357FF');
  });

  it('should handle activity click when handler provided', () => {
    const mockOnActivityClick = jest.fn();

    render(
      <ChartLegend 
        activities={mockActivities} 
        onActivityClick={mockOnActivityClick} 
      />
    );

    const activity1 = screen.getByText('Activity 1').closest('div');
    fireEvent.click(activity1!);

    expect(mockOnActivityClick).toHaveBeenCalledWith('1');
  });

  it('should not handle click when no handler provided', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    const activity1 = screen.getByText('Activity 1').closest('div');
    
    // Should not throw error when clicking without handler
    expect(() => {
      fireEvent.click(activity1!);
    }).not.toThrow();
  });

  it('should apply cursor pointer when click handler provided', () => {
    const { container } = render(
      <ChartLegend 
        activities={mockActivities} 
        onActivityClick={() => {}} 
      />
    );

    // Find the clickable div that contains the activity - it should have cursor-pointer class
    const clickableDivs = container.querySelectorAll('.cursor-pointer');
    expect(clickableDivs.length).toBeGreaterThan(0);
    expect(clickableDivs[0]).toHaveClass('cursor-pointer');
  });

  it('should not apply cursor pointer when no click handler', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    const activity1 = screen.getByText('Activity 1').closest('div');
    expect(activity1).not.toHaveClass('cursor-pointer');
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ChartLegend 
        activities={mockActivities} 
        className="custom-legend" 
      />
    );

    expect(container.firstChild).toHaveClass('custom-legend');
  });

  it('should handle single activity', () => {
    const singleActivity = [mockActivities[0]];

    render(
      <ChartLegend activities={singleActivity} />
    );

    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('(100%)')).toBeInTheDocument();
  });

  it('should handle activities with zero values', () => {
    const activitiesWithZero: Activity[] = [
      {
        id: '1',
        name: 'Zero Activity',
        value: 0,
        color: '#FF5733',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Normal Activity',
        value: 5,
        color: '#33FF57',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    render(
      <ChartLegend activities={activitiesWithZero} />
    );

    expect(screen.getByText('Zero Activity')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('Normal Activity')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should truncate long activity names', () => {
    render(
      <ChartLegend activities={mockActivities} />
    );

    const longNameElement = screen.getByText('Very Long Activity Name That Should Be Truncated');
    expect(longNameElement).toHaveClass('truncate');
  });
});
