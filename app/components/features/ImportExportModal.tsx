'use client';

import { DocumentArrowDownIcon, DocumentArrowUpIcon, TrashIcon } from '@heroicons/react/24/outline';
import React, { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { exportData, importData } from '../../lib/utils/storage';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function ImportExportModal() {
  const { state: uiState, closeImportExportModal } = useUI();
  const { state: energyState, dispatch } = useEnergy();
  const [isImporting, setIsImporting] = useState(false);
  const [importContent, setImportContent] = useState('');
  const [importError, setImportError] = useState('');
  const [replaceExistingData, setReplaceExistingData] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modalTitle = 'Import / Export';

  const handleExport = () => {
    try {
      const dataToExport = exportData(energyState.data);
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
      closeImportExportModal();
    } catch (error) {
      console.error('Import error:', error);
      const errorMsg = 'Fehler beim Importieren der Daten. Bitte überprüfe das Format.';
      setImportError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Bist du sicher, dass du alle Daten löschen möchtest? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      toast.success('Alle Daten wurden gelöscht');
      closeImportExportModal();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal isOpen={uiState.isImportExportModalOpen} onClose={closeImportExportModal} title={modalTitle} size="lg">
      <div className="space-y-6" data-testid="import-modal">
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

        {/* Export Section */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Daten exportieren
          </h3>
          <p className="mb-4 text-gray-600">Speichere deine Energiekuchen-Daten in einer JSON-Datei.</p>
          <Button onClick={handleExport} variant="secondary" className="w-full" data-testid="export-button">
            <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
            Daten exportieren
          </Button>
        </div>

        {/* Import Section */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <DocumentArrowUpIcon className="h-5 w-5" />
            Daten importieren
          </h3>
          <p className="mb-4 text-gray-600">Lade Energiekuchen-Daten aus einer JSON-Datei oder füge JSON-Text ein.</p>

          <div className="space-y-4">
            {/* File Input */}
            <div>
              <Button onClick={triggerFileInput} variant="secondary" className="mb-2 w-full">
                <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
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

        {/* Clear All Data Section */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-700">
            <TrashIcon className="h-5 w-5" />
            Alle Daten löschen
          </h3>
          <p className="mb-4 text-red-600">Löscht alle Aktivitäten und setzt die Anwendung zurück. Diese Aktion kann nicht rückgängig gemacht werden.</p>
          <Button onClick={handleClearAll} variant="danger" className="w-full">
            <TrashIcon className="mr-2 h-4 w-4" />
            Alle Daten löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
