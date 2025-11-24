import { Activity, EnergyPie } from '@/app/types';
import { ShareData } from '@/app/types/storage';
import { MAX_URL_LENGTH } from './constants';

export class SharingManager {
  private static readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://energiekuchen.de';

  static async generateShareData(data: EnergyPie): Promise<ShareData> {
    try {
      // Remove timestamps and non-essential data for sharing
      const shareableData = {
        version: data.version,
        current: {
          activities: data.current.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
            ...(a.details && { details: a.details }),
          })),
        },
        desired: {
          activities: data.desired.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
            ...(a.details && { details: a.details }),
          })),
        },
      };

      const jsonString = JSON.stringify(shareableData);
      // Use TextEncoder to handle Unicode characters properly
      const utf8Bytes = new TextEncoder().encode(jsonString);
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
      const encoded = btoa(binaryString);
      const url = `${this.BASE_URL}/share/#${encoded}`;

      if (url.length > MAX_URL_LENGTH) {
        throw new Error('Daten sind zu umfangreich zum Teilen');
      }

      return {
        encoded,
        url,
      };
    } catch (error) {
      console.error('Failed to generate share data:', error);
      throw new Error('Sharing-Daten konnten nicht erstellt werden');
    }
  }

  static decodeShareData(encoded: string): EnergyPie {
    try {
      // Decode base64 and convert back to UTF-8
      const binaryString = atob(encoded);
      const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
      const jsonString = new TextDecoder().decode(bytes);
      const data = JSON.parse(jsonString);

      // Add missing fields for full EnergyPie object
      return {
        ...data,
        current: {
          ...data.current,
          activities: data.current.activities.map((a: Activity) => ({
            ...a,
          })),
        },
        desired: {
          ...data.desired,
          activities: data.desired.activities.map((a: Activity) => ({
            ...a,
          })),
        },
      } as EnergyPie;
    } catch (error) {
      console.error('Failed to decode share data:', error);
      throw new Error('Ungültige Sharing-Daten');
    }
  }

  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}
