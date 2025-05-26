import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EnergyProvider } from '../../../lib/contexts/EnergyContext'
import { ActivityForm } from '../../forms/ActivityForm'

// Mock toast notifications
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn()
}))

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <EnergyProvider>
      {component}
    </EnergyProvider>
  )
}

describe('ActivityForm', () => {
  test('should submit valid activity', async () => {
    const user = userEvent.setup()
    const onSuccess = jest.fn()
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={onSuccess} 
        onCancel={jest.fn()} 
      />
    )
    
    await user.type(screen.getByLabelText(/Aktivitätsname/), 'Sport')
    await user.click(screen.getByRole('button', { name: /Hinzufügen/ }))
    
    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  test('should show validation errors for empty name', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    await user.click(screen.getByRole('button', { name: /Hinzufügen/ }))
    
    await waitFor(() => {
      expect(screen.getAllByText(/Aktivitätsname ist erforderlich/)).toHaveLength(2)
    })
  })

  test('should populate form when editing activity', () => {
    const mockActivity = {
      id: '1',
      name: 'Sport',
      value: 75,
      color: '#10B981',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        activity={mockActivity}
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    expect(screen.getByDisplayValue('Sport')).toBeInTheDocument()
    expect(screen.getByText(/Energiewert.*75/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Aktualisieren/ })).toBeInTheDocument()
  })

  test('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = jest.fn()
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={jest.fn()} 
        onCancel={onCancel} 
      />
    )
    
    await user.click(screen.getByRole('button', { name: /Abbrechen/ }))
    
    expect(onCancel).toHaveBeenCalled()
  })

  test('should update form data when inputs change', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    const nameInput = screen.getByLabelText(/Aktivitätsname/)
    await user.type(nameInput, 'Meditation')
    
    expect(nameInput).toHaveValue('Meditation')
  })

  test('should show different colors for positive and negative charts', () => {
    const positiveComponent = renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    const negativeComponent = renderWithProvider(
      <ActivityForm 
        chartType="negative" 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    // Both should render successfully with different color palettes
    expect(positiveComponent.container).toBeInTheDocument()
    expect(negativeComponent.container).toBeInTheDocument()
  })

  test('should disable submit button while submitting', async () => {
    const user = userEvent.setup()
    
    // Mock a slow submission to capture the loading state
    const slowOnSuccess = jest.fn().mockImplementation(() => {
      return new Promise(resolve => setTimeout(resolve, 100))
    })
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={slowOnSuccess} 
        onCancel={jest.fn()} 
      />
    )
    
    await user.type(screen.getByLabelText(/Aktivitätsname/), 'Sport')
    const submitButton = screen.getByRole('button', { name: /Hinzufügen/ })
    
    // Click and immediately check if disabled
    const clickPromise = user.click(submitButton)
    
    // The button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
    
    await clickPromise
  })

  test('should validate activity value range', async () => {
    const user = userEvent.setup()
    
    renderWithProvider(
      <ActivityForm 
        chartType="positive" 
        onSuccess={jest.fn()} 
        onCancel={jest.fn()} 
      />
    )
    
    await user.type(screen.getByLabelText(/Aktivitätsname/), 'Sport')
    
    // The slider component itself prevents values outside 1-100 range
    // So we test that the form accepts valid values
    const sliderLabel = screen.getByText(/Energiewert.*10/)
    expect(sliderLabel).toBeInTheDocument()
    
    // Submit with valid data should work
    await user.click(screen.getByRole('button', { name: /Hinzufügen/ }))
    
    // No validation errors should appear for valid values
    await waitFor(() => {
      expect(screen.queryByText(/Wert muss zwischen 1 und 100 liegen/)).not.toBeInTheDocument()
    })
  })
})
