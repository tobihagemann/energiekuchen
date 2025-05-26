import { act, renderHook } from '@testing-library/react'
import { createMockActivity } from '../../../__tests__/utils/mocks'
import { EnergyProvider, useEnergy } from '../EnergyContext'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <EnergyProvider>{children}</EnergyProvider>
)

describe('EnergyContext', () => {
  test('should add activity to positive chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })
    
    expect(result.current.state.data.positive.activities).toHaveLength(1)
    expect(result.current.state.data.positive.activities[0].name).toBe('Sport')
  })

  test('should add activity to negative chart', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('negative', {
        name: 'Stress',
        value: 30,
        color: '#EF4444'
      })
    })
    
    expect(result.current.state.data.negative.activities).toHaveLength(1)
    expect(result.current.state.data.negative.activities[0].name).toBe('Stress')
  })

  test('should update activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })
    
    const activityId = result.current.state.data.positive.activities[0].id
    
    act(() => {
      result.current.updateActivity('positive', activityId, { name: 'Fitness' })
    })
    
    expect(result.current.state.data.positive.activities[0].name).toBe('Fitness')
  })

  test('should delete activity correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })
    
    const activityId = result.current.state.data.positive.activities[0].id
    
    act(() => {
      result.current.deleteActivity('positive', activityId)
    })
    
    expect(result.current.state.data.positive.activities).toHaveLength(0)
  })

  test('should reorder activities correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Lesen',
        value: 30,
        color: '#34D399'
      })
    })
    
    expect(result.current.state.data.positive.activities[0].name).toBe('Sport')
    expect(result.current.state.data.positive.activities[1].name).toBe('Lesen')
    
    act(() => {
      result.current.reorderActivities('positive', 0, 1)
    })
    
    expect(result.current.state.data.positive.activities[0].name).toBe('Lesen')
    expect(result.current.state.data.positive.activities[1].name).toBe('Sport')
  })

  test('should update chart size', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.updateChartSize('positive', 'large')
    })
    
    expect(result.current.state.data.positive.size).toBe('large')
  })

  test('should update settings', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.updateSettings({ showTooltips: false })
    })
    
    expect(result.current.state.data.settings.showTooltips).toBe(false)
  })

  test('should reset data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    act(() => {
      result.current.addActivity('positive', {
        name: 'Sport',
        value: 50,
        color: '#10B981'
      })
    })
    
    expect(result.current.state.data.positive.activities).toHaveLength(1)
    
    act(() => {
      result.current.resetData()
    })
    
    expect(result.current.state.data.positive.activities).toHaveLength(0)
    expect(result.current.state.data.negative.activities).toHaveLength(0)
  })

  test('should import data correctly', () => {
    const { result } = renderHook(() => useEnergy(), { wrapper })
    
    const importData = JSON.stringify({
      version: '1.0',
      lastModified: new Date().toISOString(),
      positive: {
        id: 'positive',
        type: 'positive',
        activities: [createMockActivity({ name: 'Imported Activity' })],
        size: 'medium'
      },
      negative: {
        id: 'negative',
        type: 'negative',
        activities: [],
        size: 'medium'
      },
      settings: {
        chartSize: 'medium',
        colorScheme: 'default',
        showTooltips: true,
        showLegends: true,
        language: 'de'
      }
    })
    
    act(() => {
      result.current.importData(importData)
    })
    
    expect(result.current.state.data.positive.activities).toHaveLength(1)
    expect(result.current.state.data.positive.activities[0].name).toBe('Imported Activity')
  })

  test('should throw error when used outside provider', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => {
      renderHook(() => useEnergy())
    }).toThrow('useEnergy must be used within an EnergyProvider')
    
    console.error = originalError
  })
})
