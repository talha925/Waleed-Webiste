'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';

const Footer = dynamic(() => import('./Footer'));

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Don't show footer on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return <Footer />;
}