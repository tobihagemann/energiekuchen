'use client';

import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { InputGroup } from '@/app/components/ui/InputGroup';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { SharingManager } from '@/app/lib/utils/sharing';
import { exportData } from '@/app/lib/utils/storage';
import { ShareData } from '@/app/types/storage';
import { CheckIcon, ClipboardIcon, ShareIcon } from '@heroicons/react/24/outline';
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

  const handleExport = () => {
    try {
      const dataToExport = exportData(state.data);
      const blob = new Blob([dataToExport], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `energiekuchen-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Daten erfolgreich exportiert!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Fehler beim Exportieren der Daten');
    }
  };

  return (
    <Modal isOpen={uiState.isShareModalOpen} onClose={handleClose} title="Energiekuchen teilen" titleIcon={<ShareIcon className="h-5 w-5" />} size="md">
      <div className="space-y-6" data-testid="share-modal">
        {/* Share Section */}
        <div className="space-y-4">
          <div className="text-gray-600">Teile deinen Energiekuchen mit anderen, damit sie deine Energieverteilung einsehen können.</div>

          {isGenerating ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-yellow-400" role="status"></div>
              <span className="ml-2 text-sm text-gray-600">Erstelle Sharing-Link...</span>
            </div>
          ) : shareData ? (
            <>
              {/* URL Input */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Sharing-Link</label>
                <InputGroup>
                  <Input value={shareData.url} readOnly className="flex-1 text-sm" data-testid="share-url" />
                  <Button onClick={handleCopyUrl} variant="secondary" className="shrink-0">
                    {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                  </Button>
                </InputGroup>
              </div>

              {/* Quick share options */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">Schnell teilen</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const text = `Schau dir meinen Energiekuchen an: ${shareData.url}`;
                      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
                      window.open(whatsappUrl, '_blank');
                    }}>
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
                    }}>
                    E-Mail
                  </Button>
                </div>
              </div>

              {/* Info */}
              <div className="rounded-md bg-blue-50 p-3">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Der Link enthält deine Energiekuchen-Daten. Jeder mit diesem Link kann deine Aktivitäten einsehen.
                </p>
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-gray-500">
              <div className="mb-2 text-lg">⚠️</div>
              <div className="text-sm">Fehler beim Erstellen des Sharing-Links</div>
              <Button variant="secondary" size="sm" onClick={generateShareData} className="mt-3">
                Erneut versuchen
              </Button>
            </div>
          )}
        </div>

        {/* Divider */}
        <hr className="border-gray-200" />

        {/* Export Section */}
        <div className="space-y-4">
          <div className="text-gray-600">Exportiere deine Energiekuchen-Daten als JSON-Datei zur Sicherung oder Weitergabe.</div>

          <Button onClick={handleExport} variant="secondary" className="w-full" data-testid="export-button">
            Daten exportieren
          </Button>

          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-sm text-blue-800">
              <strong>Hinweis:</strong> Die exportierte Datei kann später über die Import-Funktion wieder geladen werden.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
}
