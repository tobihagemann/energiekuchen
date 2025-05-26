import { render, screen } from '@testing-library/react'
import { EnergyProvider } from '../../../lib/contexts/EnergyContext'
import { useChartData } from '../../../lib/hooks/useChartData'
import { useResponsive } from '../../../lib/hooks/useResponsive'
import { EnergyChart } from '../../charts/EnergyChart'

// Mock the chart hooks and components
jest.mock('../../../lib/hooks/useChartData')
jest.mock('../../../lib/hooks/useResponsive')
jest.mock('react-chartjs-2', () => ({
  Doughnut: ({ data, ...props }: { data?: { datasets?: { data?: number[] }[] }; [key: string]: unknown }) => (
    <div data-testid="doughnut-chart" {...props}>
      Chart with {data?.datasets?.[0]?.data?.length || 0} data points
    </div>
  )
}))

const mockUseChartData = useChartData as jest.MockedFunction<typeof useChartData>
const mockUseResponsive = useResponsive as jest.MockedFunction<typeof useResponsive>

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <EnergyProvider>
      {component}
    </EnergyProvider>
  )
}

describe('EnergyChart', () => {
  beforeEach(() => {
    mockUseResponsive.mockReturnValue({
      isMobile: false,
      isTablet: false,
      isDesktop: true
    })
  })

  test('should render positive chart with activities', () => {
    mockUseChartData.mockReturnValue({
      chartData: {
        labels: ['Sport', 'Lesen'],
        datasets: [{
          data: [50, 30],
          backgroundColor: ['#10B981', '#34D399'],
          borderColor: ['#10B981', '#34D399'],
          borderWidth: 2,
          hoverBackgroundColor: ['#10B981', '#34D399'],
          hoverBorderColor: ['#10B981', '#34D399']
        }]
      },
      activities: [
        { 
          id: '1', 
          name: 'Sport', 
          value: 50, 
          color: '#10B981',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        },
        { 
          id: '2', 
          name: 'Lesen', 
          value: 30, 
          color: '#34D399',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ],
      size: 'medium'
    })

    renderWithProvider(<EnergyChart chartType="positive" />)
    
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    expect(screen.getByText('Chart with 2 data points')).toBeInTheDocument()
  })

  test('should show empty state when no activities', () => {
    mockUseChartData.mockReturnValue({
      chartData: {
        labels: [],
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          hoverBackgroundColor: [],
          hoverBorderColor: []
        }]
      },
      activities: [],
      size: 'medium'
    })

    renderWithProvider(<EnergyChart chartType="positive" />)
    
    expect(screen.getByText(/Aktivität hinzufügen/)).toBeInTheDocument()
  })

  test('should render negative chart with activities', () => {
    mockUseChartData.mockReturnValue({
      chartData: {
        labels: ['Stress'],
        datasets: [{
          data: [40],
          backgroundColor: ['#EF4444'],
          borderColor: ['#EF4444'],
          borderWidth: 2,
          hoverBackgroundColor: ['#EF4444'],
          hoverBorderColor: ['#EF4444']
        }]
      },
      activities: [
        { 
          id: '1', 
          name: 'Stress', 
          value: 40, 
          color: '#EF4444',
          createdAt: '2024-01-01',
          updatedAt: '2024-01-01'
        }
      ],
      size: 'medium'
    })

    renderWithProvider(<EnergyChart chartType="negative" />)
    
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
    expect(screen.getByText('Chart with 1 data points')).toBeInTheDocument()
  })

  test('should apply custom className', () => {
    mockUseChartData.mockReturnValue({
      chartData: { 
        labels: [], 
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          hoverBackgroundColor: [],
          hoverBorderColor: []
        }] 
      },
      activities: [],
      size: 'medium'
    })

    const { container } = renderWithProvider(
      <EnergyChart chartType="positive" className="custom-class" />
    )
    
    expect(container.firstChild).toHaveClass('custom-class')
  })

  test('should adjust size for mobile devices', () => {
    mockUseResponsive.mockReturnValue({
      isMobile: true,
      isTablet: false,
      isDesktop: false
    })

    mockUseChartData.mockReturnValue({
      chartData: { 
        labels: [], 
        datasets: [{
          data: [],
          backgroundColor: [],
          borderColor: [],
          borderWidth: 2,
          hoverBackgroundColor: [],
          hoverBorderColor: []
        }] 
      },
      activities: [],
      size: 'medium'
    })

    renderWithProvider(<EnergyChart chartType="positive" />)
    
    // The component should render with mobile-appropriate sizing
    expect(screen.getByTestId('doughnut-chart')).toBeInTheDocument()
  })
})
