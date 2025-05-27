import { createMockEnergyKuchen } from '../../../__tests__/utils/mocks'
import { StorageManager, exportData, importData } from '../storage'

describe('StorageManager', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('should save and load data correctly', () => {
    const mockData = createMockEnergyKuchen()
    StorageManager.save(mockData)
    const loaded = StorageManager.load()
    expect(loaded).toEqual(mockData)
  })

  test('should handle export and import', () => {
    const mockData = createMockEnergyKuchen()
    const exported = exportData(mockData)
    const imported = importData(exported)
    expect(imported).toEqual(mockData)
  })

  test('should throw error for invalid import data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => importData('invalid json')).toThrow('Ungültige Datei oder Datenformat')
    
    console.error = originalError
  })

  test('should return null when no data in localStorage', () => {
    const loaded = StorageManager.load()
    expect(loaded).toBeNull()
  })

  test('should clear localStorage data', () => {
    const mockData = createMockEnergyKuchen()
    StorageManager.save(mockData)
    StorageManager.clear()
    const loaded = StorageManager.load()
    expect(loaded).toBeNull()
  })

  test('should handle localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem')
    setItemSpy.mockImplementation(() => {
      throw new Error('Storage quota exceeded')
    })
    
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()

    const mockData = createMockEnergyKuchen()
    expect(() => StorageManager.save(mockData)).toThrow('Daten konnten nicht gespeichert werden')

    console.error = originalError
  })

  test('should throw error when no data to export', () => {
    expect(() => StorageManager.export()).toThrow('Keine Daten zum Exportieren vorhanden')
  })

  test('should validate imported data structure', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    const invalidData = JSON.stringify({ version: '1.0' }) // Missing required fields
    expect(() => importData(invalidData)).toThrow('Ungültige Datei oder Datenformat')
    
    console.error = originalError
  })

  test('should handle localStorage getItem errors gracefully', () => {
    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem')
    getItemSpy.mockImplementation(() => {
      throw new Error('Storage error')
    })
    
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()

    const loaded = StorageManager.load()
    expect(loaded).toBeNull()

    console.error = originalError
  })

  test('should handle localStorage removeItem errors gracefully', () => {
    const removeItemSpy = jest.spyOn(Storage.prototype, 'removeItem')
    removeItemSpy.mockImplementation(() => {
      throw new Error('Storage error')
    })
    
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()

    // Should not throw
    expect(() => StorageManager.clear()).not.toThrow()

    console.error = originalError
  })

  test('should handle corrupted JSON data in localStorage', () => {
    // Manually set corrupted JSON in localStorage
    localStorage.setItem('energiekuchen-data', '{"invalid": json}')
    
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()

    const loaded = StorageManager.load()
    expect(loaded).toBeNull()

    console.error = originalError
  })

  test('should export valid JSON with proper formatting', () => {
    const mockData = createMockEnergyKuchen()
    StorageManager.save(mockData)
    
    const exported = StorageManager.export()
    expect(() => JSON.parse(exported)).not.toThrow()
    expect(exported).toContain('\n') // Should be formatted with newlines
  })

  test('should handle empty string import', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => importData('')).toThrow('Ungültige Datei oder Datenformat')
    
    console.error = originalError
  })

  test('should handle null values in import validation', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    const invalidData = JSON.stringify({ version: null, positive: null, negative: null })
    expect(() => importData(invalidData)).toThrow('Ungültige Datei oder Datenformat')
    
    console.error = originalError
  })

  test('should validate StorageManager.import method', () => {
    const mockData = createMockEnergyKuchen()
    const exported = JSON.stringify(mockData, null, 2)
    
    const imported = StorageManager.import(exported)
    expect(imported).toEqual(mockData)
  })

  test('should handle StorageManager.import with invalid data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error
    console.error = jest.fn()
    
    expect(() => StorageManager.import('invalid json')).toThrow('Ungültige Datei oder Datenformat')
    
    console.error = originalError
  })
})
