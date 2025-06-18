'use client';

import { LegalHeader } from '@/app/components/layout/LegalHeader';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ImpressumPage() {
  return (
    <div className="flex flex-1 flex-col">
      <LegalHeader />

      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center gap-3">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Impressum</h1>
            </div>
            <p className="text-gray-600">Rechtliche Informationen und Kontaktdaten</p>
          </div>

          <div className="space-y-8 rounded-lg bg-white p-6 shadow-sm">
            {/* Responsible Person */}
            <section>
              <h2 className="mb-4 text-xl font-semibold text-gray-900">Angaben gemäß § 5 DDG</h2>
              <div className="text-gray-600">
                <p>
                  Tobias Hagemann
                  <br />
                  Rilkestraße 34
                  <br />
                  53225 Bonn
                </p>
                <div className="mt-4 space-y-1">
                  <p>
                    <strong>E-Mail:</strong> tobias [dot] hagemann [at] gmail [dot] com
                  </p>
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
                <p>
                  Als Open Source Projekt steht der Quellcode unter entsprechender Lizenz zur freien Verfügung. Der vollständige Quellcode ist verfügbar auf{' '}
                  <a
                    href="https://github.com/tobihagemann/energiekuchen"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700">
                    GitHub
                  </a>
                  .
                </p>
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
              Energiekuchen ist ein Open Source Projekt. Der Quellcode ist auf{' '}
              <a
                href="https://github.com/tobihagemann/energiekuchen"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-800 underline hover:text-blue-900">
                GitHub
              </a>{' '}
              verfügbar. Beiträge, Verbesserungsvorschläge und Feedback sind willkommen.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
