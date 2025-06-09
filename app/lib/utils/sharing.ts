import { Activity, EnergyKuchen } from '@/app/types';
import { ShareData } from '@/app/types/storage';
import QRCode from 'qrcode';
import { MAX_URL_LENGTH } from './constants';

export class SharingManager {
  private static readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://energiekuchen.de';

  static async generateShareData(data: EnergyKuchen): Promise<ShareData> {
    try {
      // Remove timestamps and non-essential data for sharing
      const shareableData = {
        version: data.version,
        positive: {
          activities: data.positive.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
          })),
          size: data.positive.size,
        },
        negative: {
          activities: data.negative.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
          })),
          size: data.negative.size,
        },
      };

      const jsonString = JSON.stringify(shareableData);
      const encoded = btoa(encodeURIComponent(jsonString));
      const url = `${this.BASE_URL}/share/${encoded}`;

      if (url.length > MAX_URL_LENGTH) {
        throw new Error('Daten sind zu umfangreich zum Teilen');
      }

      const qrCode = await QRCode.toDataURL(url);

      return {
        encoded,
        url,
        qrCode,
      };
    } catch (error) {
      console.error('Failed to generate share data:', error);
      throw new Error('Sharing-Daten konnten nicht erstellt werden');
    }
  }

  static decodeShareData(encoded: string): EnergyKuchen {
    try {
      const jsonString = decodeURIComponent(atob(encoded));
      const data = JSON.parse(jsonString);

      // Add missing fields for full EnergyKuchen object
      const now = new Date().toISOString();

      return {
        ...data,
        lastModified: now,
        positive: {
          ...data.positive,
          id: 'positive',
          type: 'positive' as const,
          activities: data.positive.activities.map((a: Activity) => ({
            ...a,
            createdAt: now,
            updatedAt: now,
          })),
        },
        negative: {
          ...data.negative,
          id: 'negative',
          type: 'negative' as const,
          activities: data.negative.activities.map((a: Activity) => ({
            ...a,
            createdAt: now,
            updatedAt: now,
          })),
        },
      } as EnergyKuchen;
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
