'use client';

import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import RealtimeStatus from '@/components/common/RealtimeStatus';
import { useBrand } from '@/context/BrandContext';

const navLinks = [
  { href: '/admin/blogs/create', label: 'Create Blog' },
  { href: '/admin/blogs', label: 'All Blogs' },
  { href: '/admin/performance-dashboard', label: 'Performance Dashboard' },
  { href: '/admin/health', label: 'Health' },
];

const topNavLinks = [
  { href: '/', label: 'Home' },
  { href: '/stores', label: 'Stores' },
  { href: '/Categories', label: 'Categories' },
  { href: '/blog', label: 'Blog' },
];

async function handleLogout() {
  try {
    // Call logout API to clear server-side cookies
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });

    // Clear client-side storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      // Force redirect to login
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout error:', error);
    // Even if API fails, clear local storage and redirect
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
  }
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const brand = useBrand();
  return (
    <div className="min-h-screen">
      {/* Top Nav Bar */}
      <nav className="w-full bg-white shadow px-4 py-2 z-50 fixed top-0 left-0 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Image src={brand.logoPath} alt="logo" width={40} height={40} className="h-10 w-auto" />
          <span className="text-xl font-bold text-gray-800">{brand.siteName.toUpperCase()}</span>
        </div>
        <div className="flex gap-6 items-center">
          {topNavLinks.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-700 hover:text-blue-600 font-medium">
              {link.label}
            </Link>
          ))}
          <RealtimeStatus />
        </div>
      </nav>
      {/* Sidebar (fixed below nav) */}
      <aside
        className="fixed left-0 top-14 w-64 h-[calc(100vh-56px)] bg-gray-900 text-white flex flex-col py-8 px-4 space-y-8 z-40"
        style={{ top: `56px` }}
      >
        <nav className="flex flex-col gap-4 flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-4 py-2 rounded hover:bg-gray-700 transition-colors font-medium"
              prefetch={false}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="w-full mt-8 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </aside>
      {/* Main Content (offset for sidebar and nav) */}
      <main className="bg-gray-50 p-8 min-h-screen ml-64 pt-14">{children}</main>
    </div>
  );
}