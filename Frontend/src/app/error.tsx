'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App-level error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center justify-center blur-2xl opacity-20">
             <div className="w-32 h-32 bg-red-600 rounded-full animate-pulse"></div>
          </div>
          <h2 className="relative text-3xl font-black text-foreground tracking-tight">
            Something went wrong
          </h2>
        </div>
        
        <p className="text-foreground-secondary font-medium">
          We encountered an unexpected error. Don't worry, it's not you, it's us.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl text-left overflow-auto max-h-40">
            <p className="text-xs font-mono text-red-600 dark:text-red-400">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="px-6 py-3 bg-brand-primary text-white font-bold rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-brand-primary/20"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-6 py-3 bg-foreground/5 text-foreground font-bold rounded-2xl hover:bg-foreground/10 transition-colors"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
