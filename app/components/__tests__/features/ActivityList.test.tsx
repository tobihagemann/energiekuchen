import { ActivityList } from '@/app/components/features/ActivityList';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { Activity } from '@/app/types';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import toast from 'react-hot-toast';

// Mock the dependencies
jest.mock('@/app/lib/contexts/EnergyContext');
jest.mock('@/app/lib/contexts/UIContext');
jest.mock('react-hot-toast');

const mockUseEnergy = useEnergy as jest.MockedFunction<typeof useEnergy>;
const mockUseUI = useUI as jest.MockedFunction<typeof useUI>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('ActivityList', () => {
  const mockDeleteActivity = jest.fn();
  const mockSetEditingActivity = jest.fn();

  const mockActivities: Activity[] = [
    {
      id: '1',
      name: 'Test Activity 1',
      value: 3,
      color: '#FF5733',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'Test Activity 2',
      value: 5,
      color: '#33FF57',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    mockUseEnergy.mockReturnValue({
      deleteActivity: mockDeleteActivity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockUseUI.mockReturnValue({
      state: {
        editingActivity: null,
      },
      setEditingActivity: mockSetEditingActivity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    mockToast.success = jest.fn();
    mockToast.error = jest.fn();

    // Mock window.confirm
    global.confirm = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render activities list', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    expect(screen.getByText('Test Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Test Activity 2')).toBeInTheDocument();
  });

  it('should render empty state when no activities', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={[]} 
      />
    );

    expect(screen.getByText('Noch keine Aktivitäten vorhanden')).toBeInTheDocument();
    expect(screen.getByText(/Klicken Sie auf .* um zu beginnen/)).toBeInTheDocument();
  });

  it('should show add button', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    expect(screen.getByText('Hinzufügen')).toBeInTheDocument();
  });

  it('should handle edit activity', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Find edit buttons by looking for buttons containing pencil SVG paths
    const editButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg path[d*="16.862"]')
    );
    fireEvent.click(editButtons[0]);

    expect(mockSetEditingActivity).toHaveBeenCalledWith({
      chartType: 'positive',
      activityId: '1',
    });
  });

  it('should handle delete activity with confirmation', async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockDeleteActivity.mockResolvedValue(undefined);

    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Find delete buttons by looking for buttons containing trash SVG paths
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg path[d*="14.74"]')
    );
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalledWith('Möchten Sie diese Aktivität wirklich löschen?');
    
    await waitFor(() => {
      expect(mockDeleteActivity).toHaveBeenCalledWith('positive', '1');
      expect(mockToast.success).toHaveBeenCalledWith('Aktivität gelöscht');
    });
  });

  it('should not delete activity when user cancels confirmation', () => {
    (global.confirm as jest.Mock).mockReturnValue(false);

    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Find delete buttons by looking for buttons containing trash SVG paths
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg path[d*="14.74"]')
    );
    fireEvent.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
    expect(mockDeleteActivity).not.toHaveBeenCalled();
  });

  it('should handle delete error', async () => {
    (global.confirm as jest.Mock).mockReturnValue(true);
    mockDeleteActivity.mockRejectedValue(new Error('Delete failed'));

    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Find delete buttons by looking for buttons containing trash SVG paths
    const deleteButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg path[d*="14.74"]')
    );
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockToast.error).toHaveBeenCalledWith('Fehler beim Löschen der Aktivität');
    });
  });

  it('should show editing form when activity is being edited', () => {
    mockUseUI.mockReturnValue({
      state: {
        editingActivity: { chartType: 'positive', activityId: '1' },
      },
      setEditingActivity: mockSetEditingActivity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Should show the editing form for the activity
    expect(screen.getByDisplayValue('Test Activity 1')).toBeInTheDocument();
  });

  it('should show add form when add button is clicked', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    const addButton = screen.getByText('Hinzufügen');
    fireEvent.click(addButton);

    // Should show the add form
    expect(screen.getByText('Neue Aktivität hinzufügen')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should handle chart type negative', () => {
    render(
      <ActivityList 
        chartType="negative" 
        activities={mockActivities} 
      />
    );

    // Find edit buttons by looking for buttons containing pencil SVG paths
    const editButtons = screen.getAllByRole('button').filter(button => 
      button.querySelector('svg path[d*="16.862"]')
    );
    fireEvent.click(editButtons[0]);

    expect(mockSetEditingActivity).toHaveBeenCalledWith({
      chartType: 'negative',
      activityId: '1',
    });
  });

  it('should display activity values and colors', () => {
    render(
      <ActivityList 
        chartType="positive" 
        activities={mockActivities} 
      />
    );

    // Check if activity values are displayed (they are in the "Energie: X" format)
    expect(screen.getByText('Energie: 3')).toBeInTheDocument();
    expect(screen.getByText('Energie: 5')).toBeInTheDocument();
  });
});
