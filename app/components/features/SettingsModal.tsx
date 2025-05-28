'use client';

import {
  ChartPieIcon,
  CogIcon,
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  EyeIcon,
  EyeSlashIcon,
  InformationCircleIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { useEnergy } from '../../lib/contexts/EnergyContext';
import { useUI } from '../../lib/contexts/UIContext';
import { exportData } from '../../lib/utils/storage';
import { ChartSize, ColorScheme } from '../../types';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

export function SettingsModal() {
  const { state: uiState, closeSettingsModal, openImportModal } = useUI();
  const { state: energyState, dispatch } = useEnergy();
  const settings = energyState.data.settings;

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

  const handleChartSizeChange = (size: ChartSize) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { chartSize: size },
    });
    toast.success('Diagrammgröße aktualisiert');
  };

  const handleColorSchemeChange = (scheme: ColorScheme) => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { colorScheme: scheme },
    });
    toast.success('Farbschema aktualisiert');
  };

  const handleToggleTooltips = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { showTooltips: !settings.showTooltips },
    });
    toast.success(settings.showTooltips ? 'Tooltips deaktiviert' : 'Tooltips aktiviert');
  };

  const handleToggleLegends = () => {
    dispatch({
      type: 'UPDATE_SETTINGS',
      payload: { showLegends: !settings.showLegends },
    });
    toast.success(settings.showLegends ? 'Legenden deaktiviert' : 'Legenden aktiviert');
  };

  const handleResetSettings = () => {
    if (window.confirm('Sind Sie sicher, dass Sie alle Einstellungen zurücksetzen möchten?')) {
      dispatch({ type: 'RESET_SETTINGS' });
      toast.success('Einstellungen zurückgesetzt');
    }
  };

  const chartSizeOptions: { value: ChartSize; label: string }[] = [
    { value: 'small', label: 'Klein' },
    { value: 'medium', label: 'Mittel' },
    { value: 'large', label: 'Groß' },
  ];

  const colorSchemeOptions: { value: ColorScheme; label: string; description: string }[] = [
    { value: 'default', label: 'Standard', description: 'Bunte, lebendige Farben' },
    { value: 'high-contrast', label: 'Hoher Kontrast', description: 'Starke Kontraste für bessere Lesbarkeit' },
    { value: 'colorblind-friendly', label: 'Farbenblind-freundlich', description: 'Optimiert für Farbblindheit' },
  ];

  return (
    <Modal isOpen={uiState.isSettingsModalOpen} onClose={closeSettingsModal} title="Einstellungen" size="lg">
      <div className="space-y-6">
        {/* Chart Size Settings */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <ChartPieIcon className="h-5 w-5" />
            Diagrammgröße
          </h3>
          <p className="mb-4 text-gray-600">Bestimmt die Größe der Energiekuchen-Diagramme.</p>
          <div className="grid grid-cols-3 gap-2">
            {chartSizeOptions.map(option => (
              <Button
                key={option.value}
                onClick={() => handleChartSizeChange(option.value)}
                variant={settings.chartSize === option.value ? 'primary' : 'secondary'}
                className="w-full">
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Color Scheme Settings */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <PaintBrushIcon className="h-5 w-5" />
            Farbschema
          </h3>
          <p className="mb-4 text-gray-600">Wählen Sie das Farbschema für die Diagramme.</p>
          <div className="space-y-2">
            {colorSchemeOptions.map(option => (
              <div
                key={option.value}
                className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  settings.colorScheme === option.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleColorSchemeChange(option.value)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-600">{option.description}</div>
                  </div>
                  {settings.colorScheme === option.value && <div className="h-4 w-4 rounded-full bg-blue-500"></div>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Display Settings */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <EyeIcon className="h-5 w-5" />
            Anzeige
          </h3>
          <p className="mb-4 text-gray-600">Konfigurieren Sie die Anzeige der Diagramme.</p>

          <div className="space-y-4">
            {/* Tooltips Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <InformationCircleIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Tooltips anzeigen</div>
                  <div className="text-sm text-gray-600">Zeigt detaillierte Informationen beim Hover über Diagrammelemente</div>
                </div>
              </div>
              <Button onClick={handleToggleTooltips} variant="secondary" size="sm">
                {settings.showTooltips ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Legends Toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <ChartPieIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <div className="font-medium">Legenden anzeigen</div>
                  <div className="text-sm text-gray-600">Zeigt Legenden neben den Diagrammen an</div>
                </div>
              </div>
              <Button onClick={handleToggleLegends} variant="secondary" size="sm">
                {settings.showLegends ? <EyeIcon className="h-4 w-4" /> : <EyeSlashIcon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="rounded-lg border p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <DocumentArrowDownIcon className="h-5 w-5" />
            Daten verwalten
          </h3>
          <p className="mb-4 text-gray-600">Exportieren oder importieren Sie Ihre Energiekuchen-Daten.</p>
          <div className="space-y-2">
            <Button onClick={handleExport} variant="secondary" className="w-full" data-testid="export-button">
              <DocumentArrowDownIcon className="mr-2 h-4 w-4" />
              Daten exportieren
            </Button>
            <Button onClick={() => openImportModal('full')} variant="secondary" className="w-full">
              <DocumentArrowUpIcon className="mr-2 h-4 w-4" />
              Daten importieren
            </Button>
          </div>
        </div>

        {/* Reset Settings */}
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-red-700">
            <CogIcon className="h-5 w-5" />
            Einstellungen zurücksetzen
          </h3>
          <p className="mb-4 text-red-600">Setzt alle Einstellungen auf die Standardwerte zurück.</p>
          <Button onClick={handleResetSettings} variant="danger" className="w-full">
            <CogIcon className="mr-2 h-4 w-4" />
            Einstellungen zurücksetzen
          </Button>
        </div>
      </div>
    </Modal>
  );
}
