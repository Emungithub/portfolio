import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const router = useRouter();

  const isActive = (path) => {
    return router.pathname === path ? 'text-blue-600' : 'text-gray-600';
  };

  return (
    <header className="fixed w-full bg-white/90 backdrop-blur-sm shadow-sm z-50">
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors">
            Portfolio
          </Link>
          
          <div className="space-x-8">
            <Link 
              href="/" 
              className={`${isActive('/')} hover:text-blue-600 transition-colors`}
            >
              Home
            </Link>
            <Link 
              href="/about" 
              className={`${isActive('/about')} hover:text-blue-600 transition-colors`}
            >
              About
            </Link>
          </div>
        </div>
      </nav>
    </header>
  );
}