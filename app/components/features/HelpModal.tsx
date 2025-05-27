'use client';

import {
  ChartPieIcon,
  CogIcon,
  DocumentArrowUpIcon,
  PencilIcon,
  PlusIcon,
  QuestionMarkCircleIcon,
  ShareIcon,
  SwatchIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';
import { useUI } from '../../lib/contexts/UIContext';
import { Modal } from '../ui/Modal';

export function HelpModal() {
  const { state: uiState, closeHelpModal } = useUI();
  const [activeSection, setActiveSection] = useState<string>('getting-started');

  const sections = [
    {
      id: 'getting-started',
      title: 'Erste Schritte',
      icon: <QuestionMarkCircleIcon className="h-5 w-5" />,
    },
    {
      id: 'activities',
      title: 'Aktivitäten verwalten',
      icon: <PlusIcon className="h-5 w-5" />,
    },
    {
      id: 'charts',
      title: 'Diagramme verstehen',
      icon: <ChartPieIcon className="h-5 w-5" />,
    },
    {
      id: 'sharing',
      title: 'Teilen & Exportieren',
      icon: <ShareIcon className="h-5 w-5" />,
    },
    {
      id: 'settings',
      title: 'Einstellungen',
      icon: <CogIcon className="h-5 w-5" />,
    },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'getting-started':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Willkommen bei Energiekuchen!</h3>
            <p className="text-gray-600">
              Energiekuchen hilft Ihnen dabei, Ihre täglichen Energiequellen und -verbraucher zu visualisieren und zu verwalten. Hier ist ein kurzer Überblick
              über die wichtigsten Funktionen:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-sm font-bold text-white">+</div>
                <div>
                  <div className="font-semibold text-green-800">Positive Energie</div>
                  <div className="text-sm text-green-700">Aktivitäten, die Ihnen Energie geben (z.B. Sport, Musik, Zeit mit Freunden)</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-lg bg-red-50 p-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white">-</div>
                <div>
                  <div className="font-semibold text-red-800">Negative Energie</div>
                  <div className="text-sm text-red-700">Aktivitäten, die Ihnen Energie entziehen (z.B. Stress, lange Meetings, schlechter Schlaf)</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="mb-2 font-semibold">Schnellstart:</h4>
              <ol className="list-inside list-decimal space-y-1 text-sm text-gray-600">
                <li>Fügen Sie Ihre ersten Aktivitäten mit dem + Button hinzu</li>
                <li>Ordnen Sie sie den passenden Kategorien (positiv/negativ) zu</li>
                <li>Bewerten Sie ihre Stärke auf einer Skala von 1-100</li>
                <li>Betrachten Sie Ihre persönliche Energiebilanz</li>
              </ol>
            </div>
          </div>
        );

      case 'activities':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Aktivitäten verwalten</h3>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <PlusIcon className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Neue Aktivität hinzufügen</h4>
                </div>
                <p className="mb-3 text-sm text-gray-600">Klicken Sie auf den + Button in einem der Diagramme, um eine neue Aktivität hinzuzufügen.</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    • <strong>Name:</strong> Kurze, prägnante Beschreibung
                  </li>
                  <li>
                    • <strong>Intensität:</strong> 1-100 (wie stark wirkt sich diese Aktivität aus?)
                  </li>
                  <li>
                    • <strong>Farbe:</strong> Wählen Sie eine passende Farbe für bessere Übersicht
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">Aktivität bearbeiten</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Klicken Sie auf eine Aktivität in der Liste, um sie zu bearbeiten. Sie können Name, Intensität und Farbe jederzeit anpassen.
                </p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrashIcon className="h-5 w-5 text-red-600" />
                  <h4 className="font-semibold">Aktivität löschen</h4>
                </div>
                <p className="text-sm text-gray-600">Verwenden Sie den Löschen-Button beim Bearbeiten einer Aktivität, um sie dauerhaft zu entfernen.</p>
              </div>
            </div>

            <div className="rounded-lg bg-blue-50 p-4">
              <h4 className="mb-1 font-semibold text-blue-800">💡 Tipp:</h4>
              <p className="text-sm text-blue-700">
                Seien Sie ehrlich bei der Bewertung! Je genauer Sie Ihre Aktivitäten einschätzen, desto aussagekräftiger wird Ihre Energiebilanz.
              </p>
            </div>
          </div>
        );

      case 'charts':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Diagramme verstehen</h3>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Energiekuchen-Diagramme</h4>
                <p className="mb-3 text-sm text-gray-600">Die beiden Kreisdiagramme zeigen Ihre positive und negative Energie im Verhältnis zueinander.</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    • <strong>Größe der Segmente:</strong> Proportional zur eingestellten Intensität
                  </li>
                  <li>
                    • <strong>Farben:</strong> Individuell für jede Aktivität anpassbar
                  </li>
                  <li>
                    • <strong>Tooltips:</strong> Hover für detaillierte Informationen
                  </li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Energiebilanz</h4>
                <p className="mb-3 text-sm text-gray-600">Die Energiebilanz oben zeigt das Verhältnis zwischen positiver und negativer Energie:</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                    <span>
                      <strong>Positiv:</strong> Sie haben mehr Energiequellen als -verbraucher
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-gray-400"></div>
                    <span>
                      <strong>Ausgeglichen:</strong> Energiequellen und -verbraucher halten sich die Waage
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>
                      <strong>Negativ:</strong> Sie haben mehr Energieverbraucher als -quellen
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Interaktivität</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Klicken Sie auf Legende-Einträge, um Segmente ein-/auszublenden</li>
                  <li>• Verwenden Sie die Zoom-Funktion für bessere Übersicht</li>
                  <li>• Tooltips zeigen genaue Werte und Prozentanteile</li>
                </ul>
              </div>
            </div>
          </div>
        );

      case 'sharing':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Teilen & Exportieren</h3>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ShareIcon className="h-5 w-5 text-blue-600" />
                  <h4 className="font-semibold">Link teilen</h4>
                </div>
                <p className="mb-3 text-sm text-gray-600">Erstellen Sie einen Link zu Ihrer aktuellen Energiekuchen-Konfiguration:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Link wird automatisch generiert und kopiert</li>
                  <li>• QR-Code für einfaches Teilen mit mobilen Geräten</li>
                  <li>• Empfänger sehen Ihre Daten im schreibgeschützten Modus</li>
                </ul>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <DocumentArrowUpIcon className="h-5 w-5 text-green-600" />
                  <h4 className="font-semibold">Daten exportieren/importieren</h4>
                </div>
                <p className="mb-3 text-sm text-gray-600">Sichern Sie Ihre Daten oder übertragen Sie sie zwischen Geräten:</p>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>
                    • <strong>Export:</strong> Speichert alle Daten als JSON-Datei
                  </li>
                  <li>
                    • <strong>Import:</strong> Lädt Daten aus Datei oder JSON-Text
                  </li>
                  <li>• Ideal für Backups oder Gerätewechsel</li>
                </ul>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4">
              <h4 className="mb-1 font-semibold text-yellow-800">⚠️ Datenschutz:</h4>
              <p className="text-sm text-yellow-700">Geteilte Links enthalten Ihre Aktivitätsdaten. Teilen Sie sie nur mit vertrauenswürdigen Personen.</p>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Einstellungen anpassen</h3>

            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <ChartPieIcon className="h-5 w-5 text-purple-600" />
                  <h4 className="font-semibold">Diagrammgröße</h4>
                </div>
                <p className="text-sm text-gray-600">Wählen Sie zwischen klein, mittel und groß, je nach Bildschirmgröße und Präferenz.</p>
              </div>

              <div className="rounded-lg border p-4">
                <div className="mb-2 flex items-center gap-2">
                  <SwatchIcon className="h-5 w-5 text-pink-600" />
                  <h4 className="font-semibold">Farbschema</h4>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • <strong>Standard:</strong> Bunte, lebendige Farben
                  </p>
                  <p>
                    • <strong>Hoher Kontrast:</strong> Bessere Lesbarkeit
                  </p>
                  <p>
                    • <strong>Farbenblind-freundlich:</strong> Optimiert für Farbblindheit
                  </p>
                </div>
              </div>

              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Anzeige-Optionen</h4>
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    • <strong>Tooltips:</strong> Detaillierte Informationen beim Hover
                  </p>
                  <p>
                    • <strong>Legenden:</strong> Aktivitätenliste neben den Diagrammen
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <h4 className="mb-1 font-semibold text-green-800">✨ Pro-Tipp:</h4>
              <p className="text-sm text-green-700">Experimentieren Sie mit verschiedenen Einstellungen, um die für Sie optimale Darstellung zu finden!</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={uiState.isHelpModalOpen} onClose={closeHelpModal} title="Hilfe & Anleitung" size="xl">
      <div className="flex h-96 gap-6">
        {/* Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeSection === section.id ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {section.icon}
                {section.title}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-2">{renderContent()}</div>
      </div>
    </Modal>
  );
}
