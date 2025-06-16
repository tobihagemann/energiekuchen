import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center space-x-6 text-center">
          <Link href="/impressum" className="text-sm text-gray-600 hover:text-gray-900">
            Impressum
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/datenschutz" className="text-sm text-gray-600 hover:text-gray-900">
            Datenschutz
          </Link>
        </div>
      </div>
    </footer>
  );
}
