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
  const { state: uiState, closeImportModal } = useUI();
  const { state: energyState, dispatch } = useEnergy();
  const [isImporting, setIsImporting] = useState(false);
  const [importContent, setImportContent] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportContent(content);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importContent.trim()) {
      toast.error('Bitte Daten zum Importieren eingeben oder Datei auswählen');
      return;
    }

    setIsImporting(true);
    try {
      const importedData = importData(importContent);
      
      // Update the state with imported data
      dispatch({ type: 'IMPORT_DATA', payload: importedData });
      
      toast.success('Daten erfolgreich importiert!');
      setImportContent('');
      closeImportModal();
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Fehler beim Importieren der Daten. Bitte überprüfen Sie das Format.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.')) {
      dispatch({ type: 'CLEAR_ALL_DATA' });
      toast.success('Alle Daten wurden gelöscht');
      closeImportModal();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Modal 
      isOpen={uiState.isImportModalOpen} 
      onClose={closeImportModal}
      title="Import / Export"
      size="lg"
    >
      <div className="space-y-6">
        {/* Export Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Daten exportieren
          </h3>
          <p className="text-gray-600 mb-4">
            Speichern Sie Ihre Energiekuchen-Daten in einer JSON-Datei.
          </p>
          <Button onClick={handleExport} variant="secondary" className="w-full">
            <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
            Daten exportieren
          </Button>
        </div>

        {/* Import Section */}
        <div className="border rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <DocumentArrowUpIcon className="h-5 w-5" />
            Daten importieren
          </h3>
          <p className="text-gray-600 mb-4">
            Laden Sie Energiekuchen-Daten aus einer JSON-Datei oder fügen Sie JSON-Text ein.
          </p>
          
          <div className="space-y-4">
            {/* File Input */}
            <div>
              <Button 
                onClick={triggerFileInput} 
                variant="secondary" 
                className="w-full mb-2"
              >
                <DocumentArrowUpIcon className="h-4 w-4 mr-2" />
                Datei auswählen
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>

            {/* Text Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Oder JSON-Text einfügen:
              </label>
              <textarea
                value={importContent}
                onChange={(e) => setImportContent(e.target.value)}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder='{"version": "1.0", "positive": {...}, "negative": {...}}'
              />
            </div>

            {/* Import Button */}
            <Button 
              onClick={handleImport} 
              disabled={isImporting || !importContent.trim()}
              className="w-full"
            >
              {isImporting ? 'Importiere...' : 'Daten importieren'}
            </Button>
          </div>
        </div>

        {/* Clear All Data Section */}
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-red-700">
            <TrashIcon className="h-5 w-5" />
            Alle Daten löschen
          </h3>
          <p className="text-red-600 mb-4">
            Löscht alle Aktivitäten und setzt die Anwendung zurück. Diese Aktion kann nicht rückgängig gemacht werden.
          </p>
          <Button 
            onClick={handleClearAll} 
            variant="danger" 
            className="w-full"
          >
            <TrashIcon className="h-4 w-4 mr-2" />
            Alle Daten löschen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
