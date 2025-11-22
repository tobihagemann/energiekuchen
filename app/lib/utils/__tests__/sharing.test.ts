import { createMockEnergyPie } from '../../../__tests__/utils/mocks';
import { SharingManager } from '../sharing';

// Mock document methods for clipboard tests
Object.defineProperty(document, 'execCommand', {
  value: jest.fn(),
  writable: true,
});

// Mock window.location for URL generation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (window as any).location;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).location = {
  origin: 'http://localhost:3000',
  href: 'http://localhost:3000/',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
};

describe('SharingManager', () => {
  test('should generate and decode share data', async () => {
    const mockData = createMockEnergyPie();

    const shareData = await SharingManager.generateShareData(mockData);
    const decoded = SharingManager.decodeShareData(shareData.encoded);

    // Compare essential data without timestamps (since decoding adds new timestamps)
    expect(
      decoded.current.activities.map(a => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }))
    ).toEqual(
      mockData.current.activities.map(a => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }))
    );
    expect(
      decoded.desired.activities.map(a => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }))
    ).toEqual(
      mockData.desired.activities.map(a => ({
        id: a.id,
        name: a.name,
        value: a.value,
      }))
    );
    expect(shareData.url).toContain('http://localhost');
    expect(shareData.url).toContain('/share/#');
  });

  test('should handle URL length limits', async () => {
    // Suppress console.error for this test as it's expected when data is too large
    const originalError = console.error;
    console.error = jest.fn();

    const largeData = createMockEnergyPie({ activitiesCount: 20 });

    try {
      const shareData = await SharingManager.generateShareData(largeData);
      expect(shareData.url.length).toBeLessThan(2048);
    } catch (error) {
      // Expected to throw when data is too large
      expect(error).toBeInstanceOf(Error);
    }

    console.error = originalError;
  });

  test('should throw error for invalid encoded data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => SharingManager.decodeShareData('invalid-data')).toThrow();

    console.error = originalError;
  });

  test('should handle malformed JSON in encoded data', () => {
    // Suppress console.error for this test as it's expected
    const originalError = console.error;
    console.error = jest.fn();

    const invalidJson = btoa('invalid json');
    expect(() => SharingManager.decodeShareData(invalidJson)).toThrow();

    console.error = originalError;
  });

  test('should preserve essential data in sharing', async () => {
    const mockData = createMockEnergyPie();
    const shareData = await SharingManager.generateShareData(mockData);
    const decoded = SharingManager.decodeShareData(shareData.encoded);

    // Check that essential data is preserved
    expect(decoded.version).toBe(mockData.version);
  });

  test('should decode share data correctly', () => {
    const mockData = createMockEnergyPie();
    const jsonString = JSON.stringify({
      version: mockData.version,
      current: {
        activities: mockData.current.activities.map(a => ({
          id: a.id,
          name: a.name,
          value: a.value,
        })),
      },
      desired: {
        activities: mockData.desired.activities.map(a => ({
          id: a.id,
          name: a.name,
          value: a.value,
        })),
      },
    });

    const encoded = btoa(jsonString);
    const decoded = SharingManager.decodeShareData(encoded);

    // Activities should only have id, name, and value
    expect(decoded.current.activities[0]).toHaveProperty('id');
    expect(decoded.current.activities[0]).toHaveProperty('name');
    expect(decoded.current.activities[0]).toHaveProperty('value');
    expect(decoded.current.activities[0]).not.toHaveProperty('createdAt');
    expect(decoded.current.activities[0]).not.toHaveProperty('updatedAt');
  });

  test('should copy to clipboard successfully', async () => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    });

    const testText = 'test clipboard text';
    await expect(SharingManager.copyToClipboard(testText)).resolves.toBeUndefined();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(testText);
  });

  test('should handle clipboard errors gracefully', async () => {
    // Mock clipboard API to throw error
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockRejectedValue(new Error('Clipboard access denied')),
      },
    });

    // Mock document.execCommand to also throw error for fallback
    document.execCommand = jest.fn().mockImplementation(() => {
      throw new Error('document.execCommand failed');
    });

    const testText = 'test clipboard text';
    await expect(SharingManager.copyToClipboard(testText)).rejects.toThrow();
  });
});
