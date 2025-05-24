'use client';

import { Header } from '@/app/components/layout/Header';
import { Button } from '@/app/components/ui/Button';
import { HomeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PrivacyPage() {
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
          
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheckIcon className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900">
              Datenschutzerklärung
            </h1>
          </div>
          <p className="text-gray-600">
            Ihre Privatsphäre ist uns wichtig. Hier erfahren Sie, wie wir mit Ihren Daten umgehen.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 space-y-8">
          
          {/* Data Collection */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              1. Datenerhebung und -speicherung
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Lokale Speicherung:</strong> Energiekuchen speichert alle Ihre Daten ausschließlich 
                lokal in Ihrem Browser (localStorage). Es werden keine Daten an externe Server übertragen 
                oder in der Cloud gespeichert.
              </p>
              <p>
                <strong>Keine Benutzerkonten:</strong> Die Anwendung benötigt keine Registrierung oder 
                Anmeldung. Es werden keine persönlichen Identifikationsdaten erfasst.
              </p>
              <p>
                <strong>Gespeicherte Daten:</strong> Nur die von Ihnen eingegebenen Aktivitäten, deren 
                Bewertungen, Farben und Ihre App-Einstellungen werden gespeichert.
              </p>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              2. Datenfreigabe und Teilen
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Teilen-Funktion:</strong> Wenn Sie die Teilen-Funktion verwenden, werden Ihre 
                Aktivitätsdaten in den generierten Link kodiert. Diese Links enthalten Ihre kompletten 
                Daten und sollten nur mit vertrauenswürdigen Personen geteilt werden.
              </p>
              <p>
                <strong>Export/Import:</strong> Die Export-Funktion erstellt eine JSON-Datei mit Ihren 
                Daten, die Sie selbst verwalten und speichern können.
              </p>
              <p>
                <strong>Keine automatische Übertragung:</strong> Daten werden nur dann geteilt, wenn Sie 
                dies explizit durch Nutzung der Teilen- oder Export-Funktionen veranlassen.
              </p>
            </div>
          </section>

          {/* Data Processing */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              3. Datenverarbeitung
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Zweck:</strong> Ihre Daten werden ausschließlich zur Darstellung und Verwaltung 
                Ihrer persönlichen Energiebilanz verwendet.
              </p>
              <p>
                <strong>Automatische Berechnungen:</strong> Die App berechnet automatisch Ihre Energiebilanz 
                basierend auf den eingegebenen Aktivitäten und deren Bewertungen.
              </p>
              <p>
                <strong>Keine Analyse oder Profiling:</strong> Es findet keine automatische Analyse Ihrer 
                Gewohnheiten oder Erstellung von Nutzerprofilen statt.
              </p>
            </div>
          </section>

          {/* Third Parties */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              4. Drittanbieter und externe Dienste
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Keine externen Dienste:</strong> Die Anwendung nutzt keine externen Analytics-Dienste, 
                Tracking-Tools oder Werbedienste.
              </p>
              <p>
                <strong>Open Source Libraries:</strong> Die App verwendet ausschließlich Open Source JavaScript-Bibliotheken 
                für die Funktionalität (React, Chart.js, etc.), die keine Daten sammeln.
              </p>
              <p>
                <strong>Hosting:</strong> Die App wird über Vercel gehostet. Vercel kann Standard-Serverlogs 
                erstellen, die IP-Adressen und Zugriffsdaten enthalten können.
              </p>
            </div>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              5. Datensicherheit
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Browser-Sicherheit:</strong> Da alle Daten lokal in Ihrem Browser gespeichert werden, 
                unterliegen sie den Sicherheitsmaßnahmen Ihres Browsers und Betriebssystems.
              </p>
              <p>
                <strong>Verschlüsselung:</strong> Die Übertragung der Anwendung erfolgt über HTTPS.
              </p>
              <p>
                <strong>Datenverlust:</strong> Bei Löschen der Browserdaten oder Deinstallation des Browsers 
                gehen Ihre Daten verloren. Nutzen Sie die Export-Funktion für Backups.
              </p>
            </div>
          </section>

          {/* User Rights */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              6. Ihre Rechte
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                <strong>Volle Kontrolle:</strong> Sie haben jederzeit volle Kontrolle über Ihre Daten.
              </p>
              <p>
                <strong>Löschen:</strong> Sie können alle Daten jederzeit über die App-Einstellungen löschen 
                oder Ihre Browserdaten manuell löschen.
              </p>
              <p>
                <strong>Export:</strong> Sie können alle Ihre Daten jederzeit exportieren.
              </p>
              <p>
                <strong>Keine Datensammlung:</strong> Da keine personenbezogenen Daten zentral gesammelt werden, 
                gibt es keine Anfragen für Datenlöschung oder -korrektur bei uns zu stellen.
              </p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              7. Änderungen dieser Datenschutzerklärung
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Wir können diese Datenschutzerklärung gelegentlich aktualisieren. Wesentliche Änderungen 
                werden in der App kommuniziert.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              8. Kontakt
            </h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Bei Fragen zu dieser Datenschutzerklärung können Sie uns über die im 
                <Link href="/impressum" className="text-blue-600 hover:text-blue-700">
                  {' '}Impressum{' '}
                </Link>
                angegebenen Kontaktdaten erreichen.
              </p>
            </div>
          </section>

        </div>

        <div className="mt-8 bg-green-50 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheckIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">
              Zusammenfassung
            </h3>
          </div>
          <p className="text-green-700">
            <strong>Energiekuchen respektiert Ihre Privatsphäre vollständig:</strong> Alle Daten bleiben 
            auf Ihrem Gerät, es gibt keine Tracking-Mechanismen, und Sie haben jederzeit volle Kontrolle 
            über Ihre Informationen.
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Stand: Dezember 2024
          </p>
        </div>
      </main>
    </div>
  );
}
