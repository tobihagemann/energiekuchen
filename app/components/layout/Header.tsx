'use client';

import { Button } from '@/app/components/ui/Button';
import { useUI } from '@/app/lib/contexts/UIContext';
import { ArrowUpTrayIcon, QuestionMarkCircleIcon, ShareIcon } from '@heroicons/react/24/outline';

export function Header() {
  const { openShareModal, openHelpModal, openImportModal } = useUI();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm" data-testid="header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3" data-testid="logo">
            <div className="text-2xl">🥧</div>
            <h1 className="text-xl font-bold text-gray-900">Energiekuchen</h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2" data-testid="navigation">
            <Button variant="ghost" size="sm" onClick={() => openImportModal('import-only')} data-testid="import-button" className="hidden sm:flex">
              <ArrowUpTrayIcon className="mr-2 h-4 w-4" />
              <span>Importieren</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={openShareModal} data-testid="share-button">
              <ShareIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Teilen</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={openHelpModal}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openHelpModal();
                }
              }}
              data-testid="help-button"
              aria-label="Hilfe & Anleitung öffnen">
              <QuestionMarkCircleIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Hilfe</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
