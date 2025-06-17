'use client';

import { Button } from '@/app/components/ui/Button';
import { HomeIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';

export function LegalHeader() {
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
          <nav className="flex items-center" data-testid="navigation">
            <Link href="/">
              <Button variant="secondary" size="sm">
                <HomeIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Zurück zur App</span>
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
