'use client';

import { useState } from 'react';
import { themeClasses } from '@/lib/theme/utils';

export default function NewsletterSubscription() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus('error');
      setMessage('Please enter a valid email address');
      return;
    }

    setStatus('loading');

    try {
      // Here you would typically send the email to your API
      // For now, we'll just simulate a successful subscription
      await new Promise(resolve => setTimeout(resolve, 1000));

      setStatus('success');
      setMessage('Thank you for subscribing!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('Failed to subscribe. Please try again.');
    }
  };

  return (
    <div className="relative">
      <h3 className={`text-3xl font-black mb-3 text-brand-primary tracking-tight`}>
        Stay in the Loop
      </h3>
      <p className={`text-foreground-secondary mb-8 text-base font-medium leading-relaxed max-w-md`}>
        Get the latest trends and expert insights delivered straight to your inbox.
      </p>

      {status === 'success' ? (
        <div className={`px-6 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 font-bold animate-fade-in flex items-center space-x-3`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
          <span>{message}</span>
        </div>
      ) : (
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSubmit}>
          <div className="flex-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={themeClasses.inputs.default}
              disabled={status === 'loading'}
            />
          </div>
          <button
            type="submit"
            className={themeClasses.buttons.orange}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Joining...' : 'Subscribe'}
          </button>
        </form>
      )}

      {status === 'error' && (
        <div className="mt-3 text-destructive text-sm font-bold animate-shake">
          {message}
        </div>
      )}
    </div>
  );
}