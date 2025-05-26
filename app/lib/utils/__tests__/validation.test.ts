import { createMockActivity } from '../../../__tests__/utils/mocks'
import { validateActivity, validateActivityName, validateActivityValue, validateChartActivities } from '../validation'

describe('Activity Validation', () => {
  test('should validate correct activity', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 50,
      color: '#10B981'
    })
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject invalid activity name', () => {
    const result = validateActivityName('')
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Name darf nicht leer sein')
  })

  test('should reject invalid activity value', () => {
    const result = validateActivityValue(101)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Wert muss zwischen 1 und 100 liegen')
  })

  test('should reject activity name that is too long', () => {
    const longName = 'a'.repeat(51)
    const result = validateActivityName(longName)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Name darf maximal 50 Zeichen haben')
  })

  test('should reject activity name with invalid characters', () => {
    const result = validateActivityName('Test@#$%')
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Name enthält ungültige Zeichen')
  })

  test('should reject activity value below minimum', () => {
    const result = validateActivityValue(0)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Wert muss zwischen 1 und 100 liegen')
  })

  test('should reject non-integer activity value', () => {
    const result = validateActivityValue(50.5)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Wert muss eine ganze Zahl sein')
  })

  test('should reject activity with invalid color', () => {
    const result = validateActivity({
      name: 'Sport',
      value: 50,
      color: 'invalid-color'
    })
    expect(result.isValid).toBe(false)
    expect(result.errors).toContain('Ungültige Farbe')
  })

  test('should accept valid hex colors', () => {
    const shortHex = validateActivity({
      name: 'Sport',
      value: 50,
      color: '#123'
    })
    expect(shortHex.isValid).toBe(true)

    const longHex = validateActivity({
      name: 'Sport',
      value: 50,
      color: '#123456'
    })
    expect(longHex.isValid).toBe(true)
  })
})

describe('Chart Activities Validation', () => {
  test('should validate chart with valid activities', () => {
    const activities = [
      createMockActivity({ name: 'Sport' }),
      createMockActivity({ name: 'Lesen' })
    ]
    const result = validateChartActivities(activities)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  test('should reject chart with too many activities', () => {
    const activities = Array.from({ length: 21 }, (_, i) => 
      createMockActivity({ name: `Activity ${i}` })
    )
    const result = validateChartActivities(activities)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Maximal 20 Aktivitäten erlaubt')
  })

  test('should reject chart with duplicate activity names', () => {
    const activities = [
      createMockActivity({ name: 'Sport' }),
      createMockActivity({ name: 'sport' }) // Same name, different case
    ]
    const result = validateChartActivities(activities)
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('Aktivitätsnamen müssen eindeutig sein')
  })

  test('should allow empty activity list', () => {
    const result = validateChartActivities([])
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})
