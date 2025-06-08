'use client';

import { Button } from '@/app/components/ui/Button';
import { useUI } from '@/app/lib/contexts/UIContext';
import { ArrowUpTrayIcon, ShareIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

export function Header() {
  const { openShareModal, openImportExportModal } = useUI();

  return (
    <header className="border-b border-gray-200 bg-white shadow-sm" data-testid="header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo/Title */}
          <Link href="/" className="flex items-center space-x-3" data-testid="logo">
            <Image src="/logo-32@2x.png" alt="Energiekuchen Logo" width={32} height={32} className="h-8 w-8" />
            <h1 className="text-xl font-bold text-gray-900">Energiekuchen</h1>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-1 sm:space-x-2" data-testid="navigation">
            <Button variant="ghost" size="sm" onClick={openImportExportModal} data-testid="import-button">
              <ArrowUpTrayIcon className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Import/Export</span>
            </Button>

            <Button variant="ghost" size="sm" onClick={openShareModal} data-testid="share-button">
              <ShareIcon className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Teilen</span>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
