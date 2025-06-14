'use client';

import { Header } from '@/app/components/layout/Header';
import { Button } from '@/app/components/ui/Button';
import { DocumentTextIcon, HomeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ImpressumPage() {
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
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
            </div>
            <p className="text-gray-600">Rechtliche Informationen und Kontaktdaten</p>
          </div>

          <div className="space-y-8 rounded-lg bg-white p-6 shadow-sm">
            {/* Provider Information */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Anbieter</h2>
              <div className="space-y-2 text-gray-600">
                <p>
                  <strong>Energiekuchen</strong>
                  <br />
                  Eine Open Source Web-Anwendung
                </p>
                <p className="rounded-lg bg-blue-50 p-4 text-sm">
                  <strong>Hinweis:</strong> Dies ist eine Demonstration einer Open Source Anwendung. Für eine produktive Nutzung sollten hier die tatsächlichen
                  Betreiberdaten eingefügt werden.
                </p>
              </div>
            </section>

            {/* Responsible Person */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Verantwortlich für den Inhalt</h2>
              <div className="text-gray-600">
                <p>
                  [Name des Verantwortlichen]
                  <br />
                  [Straße und Hausnummer]
                  <br />
                  [PLZ] [Ort]
                  <br />
                  [Land]
                </p>
                <div className="mt-4 space-y-1">
                  <p>
                    <strong>E-Mail:</strong> [kontakt@beispiel.de]
                  </p>
                  <p>
                    <strong>Telefon:</strong> [+49 (0) 123 456789]
                  </p>
                </div>
              </div>
            </section>

            {/* Platform Information */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Technische Informationen</h2>
              <div className="space-y-4 text-gray-600">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Hosting</h3>
                  <p>
                    Diese Anwendung wird über Vercel Inc. bereitgestellt:
                    <br />
                    Vercel Inc.
                    <br />
                    340 S Lemon Ave #4133
                    <br />
                    Walnut, CA 91789
                    <br />
                    USA
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Open Source</h3>
                  <p>Energiekuchen ist eine Open Source Anwendung. Der Quellcode ist verfügbar und kann eingesehen, modifiziert und weiterverbreitet werden.</p>
                </div>
              </div>
            </section>

            {/* Disclaimer */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Haftungsausschluss</h2>
              <div className="space-y-4 text-gray-600">
                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Inhalt der Anwendung</h3>
                  <p>
                    Die Inhalte dieser Anwendung wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
                    wir jedoch keine Gewähr übernehmen.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Externe Links</h3>
                  <p>
                    Unsere Anwendung kann Links zu externen Websites enthalten. Auf den Inhalt dieser externen Seiten haben wir keinen Einfluss. Für deren
                    Inhalte sind ausschließlich deren Betreiber verantwortlich.
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-800">Nutzung auf eigene Verantwortung</h3>
                  <p>
                    Die Nutzung der Anwendung erfolgt auf eigene Verantwortung. Die Anwendung dient der persönlichen Organisation und ersetzt keine
                    professionelle Beratung.
                  </p>
                </div>
              </div>
            </section>

            {/* Copyright */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Urheberrecht</h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  Die Inhalte und Werke auf dieser Anwendung unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art
                  der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
                <p>Als Open Source Projekt steht der Quellcode unter entsprechender Lizenz zur freien Verfügung.</p>
              </div>
            </section>

            {/* Data Protection */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Datenschutz</h2>
              <div className="text-gray-600">
                <p>
                  Informationen zur Erhebung und Verarbeitung personenbezogener Daten findest du in unserer{' '}
                  <Link href="/datenschutz" className="text-blue-600 hover:text-blue-700">
                    Datenschutzerklärung
                  </Link>
                  .
                </p>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Streitschlichtung</h2>
              <div className="text-gray-600">
                <p>
                  Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
                  <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:text-blue-700">
                    https://ec.europa.eu/consumers/odr/
                  </a>
                </p>
                <p className="mt-2">
                  Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 rounded-lg bg-blue-50 p-6">
            <div className="mb-3 flex items-center gap-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">Open Source Projekt</h3>
            </div>
            <p className="text-blue-700">
              Energiekuchen ist ein Open Source Projekt. Beiträge, Verbesserungsvorschläge und Feedback sind willkommen. Die Anwendung wird kontinuierlich
              weiterentwickelt.
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
