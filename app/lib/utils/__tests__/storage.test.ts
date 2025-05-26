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
    setItemSpy.mockRestore()
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
})
