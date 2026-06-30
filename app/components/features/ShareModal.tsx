'use client';

import { CheckIcon, ClipboardIcon, ShareIcon } from '@heroicons/react/24/outline';
import { useCallback, useEffect, useRef, useState } from 'react';

import { EnergiekuchenExportSvg } from '@/app/components/charts/EnergiekuchenExportSvg';
import { Button } from '@/app/components/ui/Button';
import { ErrorMessage } from '@/app/components/ui/ErrorMessage';
import { Input } from '@/app/components/ui/Input';
import { InputGroup } from '@/app/components/ui/InputGroup';
import { LoadingSpinner } from '@/app/components/ui/LoadingSpinner';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { buildExportFilename } from '@/app/lib/utils/imageExport';
import { canShareImageFiles, downloadBlob, rasterizeSvgElement, shareImageFile } from '@/app/lib/utils/imageExportBrowser';
import { SHARE_TOO_LARGE_ERROR, SharingManager } from '@/app/lib/utils/sharing';
import { ShareData } from '@/app/types/storage';

export function ShareModal() {
  const { state } = useEnergy();
  const { state: uiState, closeShareModal } = useUI();
  const imageSvgRef = useRef<SVGSVGElement>(null);
  const [shareData, setShareData] = useState<ShareData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [shareSizeError, setShareSizeError] = useState('');
  const [canShareImage, setCanShareImage] = useState(false);
  const [imageBlob, setImageBlob] = useState<Blob | null>(null);
  const [imageShareError, setImageShareError] = useState('');

  const isBothEmpty = state.data.current.activities.length === 0 && state.data.desired.activities.length === 0;

  const generateShareData = useCallback(async () => {
    setIsGenerating(true);
    setShareSizeError('');
    try {
      const data = await SharingManager.generateShareData(state.data);
      setShareData(data);
    } catch (error) {
      console.error('Share generation error:', error);
      setShareData(null);
      if (error instanceof Error && error.message === SHARE_TOO_LARGE_ERROR) {
        setShareSizeError(error.message);
      }
    } finally {
      setIsGenerating(false);
    }
  }, [state.data]);

  useEffect(() => {
    if (uiState.isShareModalOpen && !shareData) {
      generateShareData();
    }
  }, [uiState.isShareModalOpen, shareData, generateShareData]);

  // Feature-detect image sharing on the client only, avoiding a hydration mismatch.
  useEffect(() => {
    setCanShareImage(canShareImageFiles());
  }, []);

  // Invalidate the cached PNG when the data changes so a stale image is never shared.
  useEffect(() => {
    setImageBlob(null);
  }, [state.data]);

  // Reset data when modal closes
  useEffect(() => {
    if (!uiState.isShareModalOpen) {
      setShareData(null);
      setCopied(false);
      setCopyError('');
      setShareSizeError('');
      setImageBlob(null);
      setImageShareError('');
    }
  }, [uiState.isShareModalOpen]);

  const handleCopyUrl = async () => {
    if (!shareData) return;

    setCopyError('');
    try {
      await SharingManager.copyToClipboard(shareData.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy error:', error);
      setCopyError('Fehler beim Kopieren des Links');
    }
  };

  // Pre-generate and cache the PNG once the export layout is measured. navigator.share() needs
  // transient user activation that an async rasterize would outlive, so the click handler must
  // share an already-built Blob synchronously.
  const handleImageReady = useCallback(async () => {
    const svg = imageSvgRef.current;
    if (!svg) return;
    try {
      const blob = await rasterizeSvgElement(svg);
      setImageBlob(blob);
    } catch (error) {
      console.error('Image generation error:', error);
    }
  }, []);

  const handleShareImage = async () => {
    if (!imageBlob) return;
    setImageShareError('');
    try {
      await shareImageFile(imageBlob, buildExportFilename('png'), { title: 'Mein Energiekuchen', text: 'Schau dir meinen Energiekuchen an!' });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      if (error instanceof Error && error.name === 'NotAllowedError') {
        downloadBlob(imageBlob, buildExportFilename('png'));
        return;
      }
      console.error('Image share error:', error);
      setImageShareError('Fehler beim Teilen des Bildes');
    }
  };

  const handleClose = () => {
    closeShareModal();
    setShareData(null);
    setCopied(false);
    setCopyError('');
    setShareSizeError('');
    setImageBlob(null);
    setImageShareError('');
  };

  return (
    <Modal isOpen={uiState.isShareModalOpen} onClose={handleClose} title="Energiekuchen teilen" titleIcon={<ShareIcon className="h-5 w-5" />} size="md">
      <div className="space-y-6" data-testid="share-modal">
        {/* Share Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-gray-600">Teile deinen Energiekuchen mit anderen, damit sie deine Energieverteilung einsehen können.</div>

          {isGenerating ? (
            <LoadingSpinner size="md" message="Erstelle Sharing-Link..." className="py-8" />
          ) : shareData ? (
            <>
              {/* URL Input */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- label for read-only input group */}
                <label className="mb-2 block text-sm font-medium text-gray-700">Sharing-Link</label>
                <InputGroup>
                  <Input value={shareData.url} readOnly className="flex-1 text-sm" data-testid="share-url" />
                  <Button onClick={handleCopyUrl} variant="secondary" className="shrink-0">
                    {copied ? <CheckIcon className="h-4 w-4" /> : <ClipboardIcon className="h-4 w-4" />}
                  </Button>
                </InputGroup>
                <ErrorMessage error={copyError} testId="copy-error" className="mt-2 p-2" />
              </div>

              {/* Quick share options */}
              <div>
                {/* eslint-disable-next-line jsx-a11y/label-has-associated-control -- decorative label for button group */}
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
          ) : shareSizeError ? (
            <div className="py-8 text-center text-gray-500">
              <div className="mb-2 text-lg">⚠️</div>
              <ErrorMessage error={shareSizeError} testId="share-size-error" />
            </div>
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

        {/* Image Share Section — only on platforms that support native file sharing */}
        {canShareImage && (
          <>
            <hr className="border-gray-200" />

            <div className="space-y-4 sm:space-y-6">
              <div className="text-gray-600">Teile deinen Energiekuchen als Bild direkt über deine Apps.</div>

              <Button onClick={handleShareImage} variant="secondary" className="w-full" disabled={isBothEmpty || !imageBlob} data-testid="share-image-button">
                Als Bild teilen
              </Button>

              <ErrorMessage error={imageShareError} testId="share-image-error" className="p-2" />
            </div>
          </>
        )}
      </div>

      {/* Offscreen but layout-preserving (never display:none) so the export labels can be measured
          via getBBox on the exact mobile/WebKit path this targets. */}
      {canShareImage && !isBothEmpty && (
        <div aria-hidden style={{ position: 'absolute', left: '-99999px', top: 0, width: 900, opacity: 0, pointerEvents: 'none' }}>
          <EnergiekuchenExportSvg ref={imageSvgRef} onReady={handleImageReady} />
        </div>
      )}
    </Modal>
  );
}
