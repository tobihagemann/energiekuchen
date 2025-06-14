'use client';

import { Header } from '@/app/components/layout/Header';
import { Button } from '@/app/components/ui/Button';
import { HomeIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="flex flex-1 flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-4">
              <Link href="/">
                <Button variant="secondary" size="sm">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Zurück zur App
                </Button>
              </Link>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <ShieldCheckIcon className="h-8 w-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">Datenschutzerklärung</h1>
            </div>
            <p className="text-gray-600">Deine Privatsphäre ist uns wichtig. Hier erfährst du, wie wir mit deinen Daten umgehen.</p>
          </div>

          <div className="space-y-8 rounded-lg bg-white p-6 shadow-sm">
            {/* Data Collection */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">1. Datenerhebung und -speicherung</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Lokale Speicherung:</strong> Energiekuchen speichert alle deine Daten ausschließlich lokal in deinem Browser (localStorage). Es werden
                  keine Daten an externe Server übertragen oder in der Cloud gespeichert.
                </p>
                <p>
                  <strong>Keine Benutzerkonten:</strong> Die Anwendung benötigt keine Registrierung oder Anmeldung. Es werden keine persönlichen
                  Identifikationsdaten erfasst.
                </p>
                <p>
                  <strong>Gespeicherte Daten:</strong> Nur die von dir eingegebenen Aktivitäten, deren Bewertungen und Farben werden gespeichert.
                </p>
              </div>
            </section>

            {/* Data Sharing */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">2. Datenfreigabe und Teilen</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Teilen-Funktion:</strong> Wenn du die Teilen-Funktion verwendest, werden deine Aktivitätsdaten in den generierten Link kodiert. Diese
                  Links enthalten deine kompletten Daten und sollten nur mit vertrauenswürdigen Personen geteilt werden.
                </p>
                <p>
                  <strong>Export/Import:</strong> Die Export-Funktion erstellt eine JSON-Datei mit deinen Daten, die du selbst verwalten und speichern kannst.
                </p>
                <p>
                  <strong>Keine automatische Übertragung:</strong> Daten werden nur dann geteilt, wenn du dies explizit durch Nutzung der Teilen- oder
                  Export-Funktionen veranlassen.
                </p>
              </div>
            </section>

            {/* Data Processing */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">3. Datenverarbeitung</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Zweck:</strong> Deine Daten werden ausschließlich zur Darstellung und Verwaltung deiner persönlichen Energiekuchen verwendet.
                </p>
                <p>
                  <strong>Automatische Berechnungen:</strong> Die App visualisiert deine Aktivitäten basierend auf den eingegebenen Daten und deren Bewertungen.
                </p>
                <p>
                  <strong>Keine Analyse oder Profiling:</strong> Es findet keine automatische Analyse deiner Gewohnheiten oder Erstellung von Nutzerprofilen
                  statt.
                </p>
              </div>
            </section>

            {/* Third Parties */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">4. Drittanbieter und externe Dienste</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Keine externen Dienste:</strong> Die Anwendung nutzt keine externen Analytics-Dienste, Tracking-Tools oder Werbedienste.
                </p>
                <p>
                  <strong>Open Source Libraries:</strong> Die App verwendet ausschließlich Open Source JavaScript-Bibliotheken für die Funktionalität (React,
                  Chart.js, etc.), die keine Daten sammeln.
                </p>
                <p>
                  <strong>Hosting:</strong> Die App wird über Vercel gehostet. Vercel kann Standard-Serverlogs erstellen, die IP-Adressen und Zugriffsdaten
                  enthalten können.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">5. Datensicherheit</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Browser-Sicherheit:</strong> Da alle Daten lokal in deinem Browser gespeichert werden, unterliegen sie den Sicherheitsmaßnahmen deines
                  Browsers und Betriebssystems.
                </p>
                <p>
                  <strong>Verschlüsselung:</strong> Die Übertragung der Anwendung erfolgt über HTTPS.
                </p>
                <p>
                  <strong>Datenverlust:</strong> Bei Löschen der Browserdaten oder Deinstallation des Browsers gehen deine Daten verloren. Nutze die
                  Export-Funktion für Backups.
                </p>
              </div>
            </section>

            {/* User Rights */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">6. Deine Rechte</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong>Volle Kontrolle:</strong> Du hast jederzeit volle Kontrolle über deine Daten.
                </p>
                <p>
                  <strong>Löschen:</strong> Du kannst alle Daten jederzeit über deine Browserdaten manuell löschen.
                </p>
                <p>
                  <strong>Export:</strong> Du kannst alle deine Daten jederzeit exportieren.
                </p>
                <p>
                  <strong>Keine Datensammlung:</strong> Da keine personenbezogenen Daten zentral gesammelt werden, gibt es keine Anfragen für Datenlöschung oder
                  -korrektur bei uns zu stellen.
                </p>
              </div>
            </section>

            {/* Changes */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">7. Änderungen dieser Datenschutzerklärung</h2>
              <div className="space-y-4 text-gray-600">
                <p>Wir können diese Datenschutzerklärung gelegentlich aktualisieren. Wesentliche Änderungen werden in der App kommuniziert.</p>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">8. Kontakt</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Bei Fragen zu dieser Datenschutzerklärung kannst du uns über die im
                  <Link href="/impressum" className="text-blue-600 hover:text-blue-700">
                    {' '}
                    Impressum{' '}
                  </Link>
                  angegebenen Kontaktdaten erreichen.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-lg bg-green-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <ShieldCheckIcon className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Zusammenfassung</h3>
            </div>
            <p className="text-green-700">
              <strong>Energiekuchen respektiert deine Privatsphäre vollständig:</strong> Alle Daten bleiben auf deinem Gerät, es gibt keine
              Tracking-Mechanismen, und du hast jederzeit volle Kontrolle über deine Informationen.
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">Stand: Dezember 2024</p>
          </div>
        </div>
      </main>
    </div>
  );
}
