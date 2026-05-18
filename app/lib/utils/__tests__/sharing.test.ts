import { createMockEnergyPie } from '../../../__tests__/utils/mocks';
import { SharingManager } from '../sharing';

Object.defineProperty(document, 'execCommand', { value: jest.fn(), writable: true });

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
  test('round-trip preserves weight + polarity', async () => {
    const data = createMockEnergyPie();
    const share = await SharingManager.generateShareData(data);
    const decoded = SharingManager.decodeShareData(share.encoded);

    expect(decoded.version).toBe('3.0');
    expect(decoded.current.activities.map(a => ({ name: a.name, weight: a.weight, polarity: a.polarity }))).toEqual(
      data.current.activities.map(a => ({ name: a.name, weight: a.weight, polarity: a.polarity }))
    );
    expect(share.url).toContain('/share/#');
  });

  test('decodes legacy v2 (value-shaped) share URL', () => {
    const v2Payload = btoa(
      JSON.stringify({
        version: '2.0',
        current: { activities: [{ id: '1', name: 'Sport', value: 3 }] },
        desired: { activities: [] },
      })
    );
    const decoded = SharingManager.decodeShareData(v2Payload);
    expect(decoded.version).toBe('3.0');
    expect(decoded.current.activities[0].weight).toBe(Math.pow(2, 2));
    expect(decoded.current.activities[0].polarity).toBe('positive');
  });

  test('propagates the size-specific error for oversized payloads', async () => {
    const originalError = console.error;
    console.error = jest.fn();

    const large = createMockEnergyPie({ activitiesCount: 20 });
    for (let i = 0; i < large.current.activities.length; i++) {
      large.current.activities[i].name = 'A'.repeat(50);
      large.current.activities[i].details = 'B'.repeat(150);
    }
    for (let i = 0; i < large.desired.activities.length; i++) {
      large.desired.activities[i].name = 'C'.repeat(50);
      large.desired.activities[i].details = 'D'.repeat(150);
    }

    await expect(SharingManager.generateShareData(large)).rejects.toThrow('Daten sind zu umfangreich zum Teilen');

    console.error = originalError;
  });

  test('wraps decode failures as "Ungültige Sharing-Daten"', () => {
    const originalError = console.error;
    console.error = jest.fn();
    expect(() => SharingManager.decodeShareData('not-base64!!!')).toThrow('Ungültige Sharing-Daten');
    expect(() => SharingManager.decodeShareData(btoa('invalid json'))).toThrow('Ungültige Sharing-Daten');
    console.error = originalError;
  });

  test('preserves details and unicode', async () => {
    const data = createMockEnergyPie();
    data.current.activities[0].details = 'Jeden Tag → 30 Minuten\nÄöüß ✨';
    data.current.activities[0].name = 'Bücher lesen 📚';

    const share = await SharingManager.generateShareData(data);
    const decoded = SharingManager.decodeShareData(share.encoded);
    expect(decoded.current.activities[0].details).toBe('Jeden Tag → 30 Minuten\nÄöüß ✨');
    expect(decoded.current.activities[0].name).toBe('Bücher lesen 📚');
  });

  test('copy to clipboard uses navigator API when available', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    await expect(SharingManager.copyToClipboard('hello')).resolves.toBeUndefined();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('hello');
  });

  test('decodeShareData rejects oversized fragments before decoding', () => {
    const originalError = console.error;
    console.error = jest.fn();
    const huge = 'A'.repeat(3000);
    expect(() => SharingManager.decodeShareData(huge)).toThrow('Ungültige Sharing-Daten');
    console.error = originalError;
  });

  test('wraps non-size encoding errors as the generic share-error message', async () => {
    const originalError = console.error;
    console.error = jest.fn();
    const originalStringify = JSON.stringify;
    // Force a non-size error to flow through the outer catch.
    (JSON as { stringify: typeof JSON.stringify }).stringify = (() => {
      throw new TypeError('synthetic stringify failure');
    }) as typeof JSON.stringify;
    try {
      await expect(SharingManager.generateShareData(createMockEnergyPie())).rejects.toThrow('Sharing-Daten konnten nicht erstellt werden');
    } finally {
      (JSON as { stringify: typeof JSON.stringify }).stringify = originalStringify;
      console.error = originalError;
    }
  });

  test('clipboard fallback uses execCommand', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockRejectedValue(new Error('denied')) },
    });
    document.execCommand = jest.fn().mockReturnValue(true);
    await expect(SharingManager.copyToClipboard('fallback')).resolves.toBeUndefined();
  });
});
