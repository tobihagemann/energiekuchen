'use client';

import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { importData } from '../../lib/utils/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ImportModal() {
  const { state: uiState, closeImportModal } = useUI();
  const { dispatch } = useEnergy();
  const [isImporting, setIsImporting] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const [replaceExistingData, setReplaceExistingData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalTitle = 'Energiekuchen importieren';

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(''); // Clear any previous errors
    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importContent.trim()) {
      const errorMsg = 'Bitte Daten zum Importieren eingeben oder Datei auswählen';
      setImportError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsImporting(true);
    setImportError('');
    try {
      const importedData = importData(importContent);

      // Update the state with imported data
      dispatch({
        type: 'IMPORT_DATA',
        payload: {
          data: importedData,
          replaceExisting: replaceExistingData,
        },
      });

      toast.success('Daten erfolgreich importiert!');
      setImportContent('');
      closeImportModal();
    } catch (error) {
      console.error('Import error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Fehler beim Importieren der Daten. Bitte überprüfe das Format.';
      setImportError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={uiState.isImportModalOpen} onClose={closeImportModal} title={modalTitle} titleIcon={<ArrowDownTrayIcon className="h-5 w-5" />} size="md">
      <div className="space-y-4 sm:space-y-6" data-testid="import-modal">
        {/* Error Display */}
        {importError && (
          <div>
            <div
              id="import-error"
              data-testid="import-error"
              className="error rounded-md border border-red-200 bg-red-50 p-3 text-red-700"
              role="alert"
              aria-live="polite">
              {importError}
            </div>
          </div>
        )}

        {/* Import Section */}
        <div>
          <p className="mb-4 text-gray-600">Lade Energiekuchen-Daten aus einer JSON-Datei oder füge JSON-Text ein.</p>

          <div className="space-y-4 sm:space-y-6">
            {/* File Input */}
            <div>
              <Button onClick={triggerFileInput} variant="secondary" className="mb-2 w-full">
                Datei auswählen
              </Button>
              <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} className="hidden" data-testid="import-file-input" />
            </div>

            {/* Text Input */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">Oder JSON-Text einfügen:</label>
              <textarea
                value={importContent}
                onChange={e => {
                  setImportContent(e.target.value);
                  setImportError(''); // Clear error when content changes
                }}
                className="h-32 w-full resize-none rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder='{"version": "1.0", "positive": {...}, "negative": {...}}'
                data-testid="import-json-textarea"
              />
            </div>

            {/* Replace Option */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={replaceExistingData}
                  onChange={e => setReplaceExistingData(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  data-testid="import-replace-option"
                />
                <span className="text-sm text-gray-700">Bestehende Daten ersetzen (anstatt hinzuzufügen)</span>
              </label>
            </div>

            {/* Import Button */}
            <Button onClick={handleImport} disabled={isImporting || !importContent.trim()} className="w-full" data-testid="import-submit">
              {isImporting ? 'Importiere...' : 'Daten importieren'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
