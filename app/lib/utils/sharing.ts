import { EnergyPie } from '@/app/types';
import { ShareData } from '@/app/types/storage';

import { MAX_URL_LENGTH } from './constants';
import { importData, toV3Serializable } from './storage';

export const SHARE_TOO_LARGE_ERROR = 'Daten sind zu umfangreich zum Teilen';

export class SharingManager {
  private static readonly BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'https://energiekuchen.de';

  static async generateShareData(data: EnergyPie): Promise<ShareData> {
    try {
      const shareableData = toV3Serializable(data);

      const jsonString = JSON.stringify(shareableData);
      const utf8Bytes = new TextEncoder().encode(jsonString);
      const binaryString = Array.from(utf8Bytes, byte => String.fromCharCode(byte)).join('');
      const encoded = btoa(binaryString);
      const url = `${this.BASE_URL}/share/#${encoded}`;

      if (url.length > MAX_URL_LENGTH) {
        throw new Error(SHARE_TOO_LARGE_ERROR);
      }

      return {
        encoded,
        url,
      };
    } catch (error) {
      console.error('Failed to generate share data:', error);
      if (error instanceof Error && error.message === SHARE_TOO_LARGE_ERROR) {
        throw error;
      }
      throw new Error('Sharing-Daten konnten nicht erstellt werden');
    }
  }

  static decodeShareData(encoded: string): EnergyPie {
    try {
      // Bound the input before decoding so an oversized hash can't force large allocations.
      if (encoded.length > MAX_URL_LENGTH) {
        throw new Error('Ungültige Sharing-Daten');
      }
      const binaryString = atob(encoded);
      const bytes = Uint8Array.from(binaryString, char => char.charCodeAt(0));
      const jsonString = new TextDecoder().decode(bytes);
      return importData(jsonString);
    } catch (error) {
      console.error('Failed to decode share data:', error);
      throw new Error('Ungültige Sharing-Daten');
    }
  }

  static async copyToClipboard(text: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }
}
