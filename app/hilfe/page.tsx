'use client';

import { Header } from '@/app/components/layout/Header';
import { Button } from '@/app/components/ui/Button';
import {
    ChartPieIcon,
    CogIcon,
    HomeIcon,
    PlusIcon,
    QuestionMarkCircleIcon,
    ShareIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function HelpPage() {
  const sections = [
    {
      id: 'getting-started',
      title: 'Erste Schritte',
      icon: <QuestionMarkCircleIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <p>
            Willkommen bei Energiekuchen! Diese Anwendung hilft Ihnen dabei, Ihre täglichen 
            Energiequellen und -verbraucher zu visualisieren und zu verwalten.
          </p>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">🌟 Positive Energie</h4>
              <p className="text-green-700 text-sm">
                Aktivitäten, die Ihnen Energie geben: Sport, Musik, Zeit mit Freunden, 
                guter Schlaf, Hobbys, Natur, Meditation
              </p>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">⚡ Negative Energie</h4>
              <p className="text-red-700 text-sm">
                Aktivitäten, die Ihnen Energie entziehen: Stress, Überstunden, 
                schwierige Gespräche, schlechter Schlaf, Sorgen
              </p>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🚀 Schnellstart</h4>
            <ol className="list-decimal list-inside space-y-1 text-blue-700 text-sm">
              <li>Fügen Sie Ihre ersten Aktivitäten mit dem + Button hinzu</li>
              <li>Ordnen Sie sie den passenden Kategorien zu</li>
              <li>Bewerten Sie ihre Stärke auf einer Skala von 1-100</li>
              <li>Betrachten Sie Ihre persönliche Energiebilanz</li>
            </ol>
          </div>
        </div>
      )
    },
    {
      id: 'activities',
      title: 'Aktivitäten verwalten',
      icon: <PlusIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <PlusIcon className="h-5 w-5 text-green-600" />
                <h4 className="font-semibold">Hinzufügen</h4>
              </div>
              <p className="text-sm text-gray-600">
                Klicken Sie auf den + Button in einem Diagramm, um neue Aktivitäten hinzuzufügen.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CogIcon className="h-5 w-5 text-blue-600" />
                <h4 className="font-semibold">Bearbeiten</h4>
              </div>
              <p className="text-sm text-gray-600">
                Klicken Sie auf eine Aktivität in der Liste, um Name, Intensität und Farbe anzupassen.
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="h-5 w-5 text-red-600">🗑️</span>
                <h4 className="font-semibold">Löschen</h4>
              </div>
              <p className="text-sm text-gray-600">
                Verwenden Sie den Löschen-Button beim Bearbeiten einer Aktivität.
              </p>
            </div>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">💡 Bewertungstipps</h4>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• 1-30: Schwacher Einfluss auf Ihr Energielevel</li>
              <li>• 31-70: Mittlerer Einfluss auf Ihr Energielevel</li>
              <li>• 71-100: Starker Einfluss auf Ihr Energielevel</li>
              <li>• Seien Sie ehrlich - je genauer, desto aussagekräftiger</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'charts',
      title: 'Diagramme verstehen',
      icon: <ChartPieIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Energiekuchen-Diagramme</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• <strong>Segmentgröße:</strong> Proportional zur Intensität</li>
                <li>• <strong>Farben:</strong> Individuell anpassbar</li>
                <li>• <strong>Tooltips:</strong> Hover für Details</li>
                <li>• <strong>Interaktivität:</strong> Klicken zum Ein-/Ausblenden</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Energiebilanz</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span><strong>Positiv:</strong> Mehr Energiequellen</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span><strong>Ausgeglichen:</strong> Balance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span><strong>Negativ:</strong> Mehr Energieverbraucher</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-800 mb-2">🎯 Ziel</h4>
            <p className="text-purple-700 text-sm">
              Streben Sie eine positive oder ausgeglichene Energiebilanz an. Wenn Ihre Bilanz 
              stark negativ ist, überlegen Sie, wie Sie mehr Energiequellen in Ihren Alltag 
              integrieren oder Energieverbraucher reduzieren können.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'sharing',
      title: 'Teilen & Exportieren',
      icon: <ShareIcon className="h-6 w-6" />,
      content: (
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-semibold">Link teilen</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Automatisch generierter Link</li>
                <li>• QR-Code für mobile Geräte</li>
                <li>• Schreibgeschützter Modus für Empfänger</li>
                <li>• Keine Serverdaten - alles im Link</li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold">Daten sichern</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Export als JSON-Datei</li>
                <li>• Import von Datei oder Text</li>
                <li>• Ideal für Backups</li>
                <li>• Übertragung zwischen Geräten</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-red-800 mb-2">⚠️ Datenschutz</h4>
            <p className="text-red-700 text-sm">
              Geteilte Links enthalten Ihre kompletten Aktivitätsdaten. Teilen Sie sie nur 
              mit vertrauenswürdigen Personen. Die Daten werden nicht auf Servern gespeichert.
            </p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/">
              <Button variant="secondary" size="sm">
                <HomeIcon className="h-4 w-4 mr-2" />
                Zurück zur App
              </Button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hilfe & Anleitung
          </h1>
          <p className="text-gray-600">
            Alles was Sie über Energiekuchen wissen müssen
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <div key={section.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-blue-600">
                  {section.icon}
                </div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {section.title}
                </h2>
              </div>
              {section.content}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Weitere Fragen?
          </h2>
          <p className="text-gray-600 mb-4">
            Falls Sie weitere Fragen haben oder Feedback geben möchten, nutzen Sie gerne die 
            Hilfe-Funktion in der App oder besuchen Sie unsere anderen Informationsseiten.
          </p>
          <div className="flex gap-4">
            <Link href="/datenschutz">
              <Button variant="secondary">Datenschutz</Button>
            </Link>
            <Link href="/impressum">
              <Button variant="secondary">Impressum</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
