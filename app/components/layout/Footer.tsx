import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-600">
            <Link href="/impressum" className="transition-colors hover:text-gray-900">
              Impressum
            </Link>
            <span className="hidden text-gray-300 sm:inline">•</span>
            <Link href="/datenschutz" className="transition-colors hover:text-gray-900">
              Datenschutz
            </Link>
            <span className="hidden text-gray-300 sm:inline">•</span>
            <a href="https://github.com/tobihagemann/energiekuchen" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-gray-900">
              Quellcode auf GitHub
            </a>
          </div>
          <div className="text-xs text-gray-400">
            ©{' '}
            <a href="https://tobiha.de/" target="_blank" rel="noopener noreferrer" className="underline transition-colors hover:text-gray-600">
              Tobias Hagemann
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
