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
        positive: {
          activities: data.positive.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
          })),
        },
        negative: {
          activities: data.negative.activities.map(a => ({
            id: a.id,
            name: a.name,
            value: a.value,
          })),
        },
      };

      const jsonString = JSON.stringify(shareableData);
      const encoded = btoa(jsonString);
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
      const jsonString = atob(encoded);
      const data = JSON.parse(jsonString);

      // Add missing fields for full EnergyPie object
      return {
        ...data,
        positive: {
          ...data.positive,
          activities: data.positive.activities.map((a: Activity) => ({
            ...a,
          })),
        },
        negative: {
          ...data.negative,
          activities: data.negative.activities.map((a: Activity) => ({
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
