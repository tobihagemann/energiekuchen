'use client';

import { Button } from '@/app/components/ui/Button';
import { useUI } from '@/app/lib/contexts/UIContext';
import {
    ArrowUpTrayIcon,
    Cog6ToothIcon,
    QuestionMarkCircleIcon,
    ShareIcon
} from '@heroicons/react/24/outline';

export function Header() {
  const { 
    openShareModal, 
    openSettingsModal, 
    openHelpModal, 
    openImportModal 
  } = useUI();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🥧</div>
            <h1 className="text-xl font-bold text-gray-900">
              Energiekuchen
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={openImportModal}
              className="hidden sm:flex"
            >
              <ArrowUpTrayIcon className="w-4 h-4 mr-2" />
              Importieren
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={openShareModal}
            >
              <ShareIcon className="w-4 h-4 mr-2" />
              Teilen
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={openSettingsModal}
            >
              <Cog6ToothIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Einstellungen</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={openHelpModal}
            >
              <QuestionMarkCircleIcon className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Hilfe</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
