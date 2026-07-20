import Link from 'next/link';
import { getBrandConfig } from '@config/server-config';

export default async function NotFound() {
  const brand = await getBrandConfig();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <h1 className="text-9xl font-black text-foreground/5 select-none">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <h2 className="text-3xl font-black text-foreground tracking-tight">
              Page Not Found
            </h2>
          </div>
        </div>
        
        <p className="text-foreground-secondary font-medium">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-4 bg-brand-primary text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-xl shadow-brand-primary/25"
          >
            Back to {brand.siteName}
          </Link>
        </div>
      </div>
    </div>
  );
}
