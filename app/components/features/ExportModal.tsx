'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';

import { EnergiekuchenExportSvg } from '@/app/components/charts/EnergiekuchenExportSvg';
import { Button } from '@/app/components/ui/Button';
import { ErrorMessage } from '@/app/components/ui/ErrorMessage';
import { Modal } from '@/app/components/ui/Modal';
import { useEnergy } from '@/app/lib/contexts/EnergyContext';
import { useUI } from '@/app/lib/contexts/UIContext';
import { buildExportFilename } from '@/app/lib/utils/imageExport';
import { downloadBlob, rasterizeSvgElement } from '@/app/lib/utils/imageExportBrowser';
import { exportData } from '@/app/lib/utils/storage';

export function ExportModal() {
  const { state } = useEnergy();
  const { state: uiState, closeExportModal } = useUI();
  const svgRef = useRef<SVGSVGElement>(null);
  const [isImageReady, setIsImageReady] = useState(false);
  const [imageError, setImageError] = useState('');
  const [exportError, setExportError] = useState('');

  const isBothEmpty = state.data.current.activities.length === 0 && state.data.desired.activities.length === 0;

  // Reset transient state when the modal closes (the preview unmounts, so readiness resets too).
  useEffect(() => {
    if (!uiState.isExportModalOpen) {
      setIsImageReady(false);
      setImageError('');
      setExportError('');
    }
  }, [uiState.isExportModalOpen]);

  const handleDownloadImage = async () => {
    const svg = svgRef.current;
    if (!svg) return;
    setImageError('');
    try {
      const blob = await rasterizeSvgElement(svg);
      downloadBlob(blob, buildExportFilename('png'));
    } catch (error) {
      console.error('Image export error:', error);
      setImageError('Fehler beim Erstellen des Bildes');
    }
  };

  const handleExportJson = () => {
    setExportError('');
    try {
      const dataToExport = exportData(state.data);
      const blob = new Blob([dataToExport], { type: 'application/json' });
      downloadBlob(blob, buildExportFilename('json'));
    } catch (error) {
      console.error('Export error:', error);
      setExportError('Fehler beim Exportieren der Daten');
    }
  };

  const handleClose = () => {
    closeExportModal();
    setIsImageReady(false);
    setImageError('');
    setExportError('');
  };

  return (
    <Modal
      isOpen={uiState.isExportModalOpen}
      onClose={handleClose}
      title="Energiekuchen exportieren"
      titleIcon={<ArrowDownTrayIcon className="h-5 w-5" />}
      size="md">
      <div className="space-y-6" data-testid="export-modal">
        {/* Image Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-gray-600">Speichere deinen Energiekuchen als Bild (PNG), um ihn zu sichern, auszudrucken oder weiterzugeben.</div>

          {!isBothEmpty && (
            <div className="overflow-hidden rounded-md border border-gray-200 bg-white p-2">
              <EnergiekuchenExportSvg ref={svgRef} onReady={() => setIsImageReady(true)} />
            </div>
          )}

          <Button
            onClick={handleDownloadImage}
            variant="secondary"
            className="w-full"
            disabled={isBothEmpty || !isImageReady}
            data-testid="export-image-button">
            Als Bild herunterladen
          </Button>

          <ErrorMessage error={imageError} testId="export-image-error" className="p-2" />
        </div>

        <hr className="border-gray-200" />

        {/* JSON Section */}
        <div className="space-y-4 sm:space-y-6">
          <div className="text-gray-600">Exportiere deine Energiekuchen-Daten als JSON-Datei zur Sicherung oder Weitergabe.</div>

          <Button onClick={handleExportJson} variant="secondary" className="w-full" data-testid="export-button">
            Als JSON exportieren
          </Button>

          <ErrorMessage error={exportError} testId="export-error" className="p-2" />

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
