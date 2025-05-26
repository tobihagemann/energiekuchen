'use client';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { SharingManager } from '@/app/lib/utils/sharing';
import { ShareData } from '@/app/types/storage';
import { CheckIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';

export function ShareModal() {
  const { state } = useEnergy();
  const { state: uiState, closeShareModal } = useUI();
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateShareData = useCallback(async () => {
    setIsGenerating(true);
    try {
      const data = await SharingManager.generateShareData(state.data);
      setShareData(data);
    } catch (error) {
      toast.error('Fehler beim Erstellen der Sharing-Daten');
      console.error('Share generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [state.data]);

  useEffect(() => {
    if (uiState.isShareModalOpen && !shareData) {
      generateShareData();
    }
  }, [uiState.isShareModalOpen, shareData, generateShareData]);

  // Reset data when modal closes
  useEffect(() => {
    if (!uiState.isShareModalOpen) {
      setShareData(null);
      setCopied(false);
    }
  }, [uiState.isShareModalOpen]);

  const handleCopyUrl = async () => {
    if (!shareData) return;

    try {
      await SharingManager.copyToClipboard(shareData.url);
      setCopied(true);
      toast.success('Link kopiert!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Fehler beim Kopieren des Links');
    }
  };

  const handleClose = () => {
    closeShareModal();
    setShareData(null);
    setCopied(false);
  };

  return (
    <Modal
      isOpen={uiState.isShareModalOpen}
      onClose={handleClose}
      title="Energiekuchen teilen"
      size="md"
    >
      <div className="space-y-6">
        <div className="text-sm text-gray-600">
          Teilen Sie Ihre Energiekuchen mit anderen, damit sie Ihre Energieverteilung 
          einsehen können.
        </div>

        {isGenerating ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" role="status"></div>
            <span className="ml-2 text-sm text-gray-600">
              Erstelle Sharing-Link...
            </span>
          </div>
        ) : shareData ? (
          <div className="space-y-4">
            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sharing-Link
              </label>
              <div className="flex space-x-2">
                <Input
                  value={shareData.url}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="secondary"
                  className="flex-shrink-0"
                >
                  {copied ? (
                    <CheckIcon className="w-4 h-4" />
                  ) : (
                    <ClipboardIcon className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* QR Code */}
            <div className="text-center">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                QR-Code
              </label>
              <div className="inline-block p-4 bg-white border border-gray-200 rounded-lg">
                <Image
                  src={shareData.qrCode}
                  alt="QR Code zum Teilen"
                  width={128}
                  height={128}
                  className="w-32 h-32"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                QR-Code scannen zum direkten Öffnen
              </p>
            </div>

            {/* Quick share options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schnell teilen
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const text = `Schau dir meinen Energiekuchen an: ${shareData.url}`;
                    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                >
                  WhatsApp
                </Button>
                
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const subject = 'Mein Energiekuchen';
                    const body = `Hallo!\n\nIch möchte meinen Energiekuchen mit dir teilen:\n\n${shareData.url}\n\nViele Grüße!`;
                    const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                    window.open(mailUrl);
                  }}
                >
                  E-Mail
                </Button>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Hinweis:</strong> Der Link enthält Ihre Energiekuchen-Daten. 
                Jeder mit diesem Link kann Ihre Aktivitäten einsehen.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-lg mb-2">⚠️</div>
            <div className="text-sm">Fehler beim Erstellen des Sharing-Links</div>
            <Button
              variant="secondary"
              size="sm"
              onClick={generateShareData}
              className="mt-3"
            >
              Erneut versuchen
            </Button>
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="secondary" onClick={handleClose}>
            Schließen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
