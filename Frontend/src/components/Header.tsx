"use client";

import Image from "next/image";
import Link from "next/link";
import { LogOut, Search, X } from "lucide-react";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth";
import { useApp } from "@/context/AppContext";
import { useBrand } from "@/context/BrandContext";
import { usePathname } from "next/navigation";


import SearchBar from "@/components/ui/SearchBar";
import { useState, useEffect } from "react";
import { themeClasses } from "@/lib/theme/utils";
import dynamic from "next/dynamic";

const NotificationToast = dynamic(() => import("@/components/ui/NotificationToast"), { ssr: false });
const HeaderMobileMenu = dynamic(() => import("@/components/HeaderMobileMenu"), { ssr: false });

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();
  const { state } = useApp();
  const brand = useBrand();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Static Categories
  const STATIC_CATEGORIES = [
    { _id: '1', name: 'Health and Beauty', slug: 'health-and-beauty' },
    { _id: '2', name: 'Home and Tech', slug: 'home-and-tech' },
    { _id: '3', name: 'Lifestyle', slug: 'lifestyle' },
    { _id: '4', name: 'Sports and Fitness', slug: 'sports-and-fitness' },
    { _id: '5', name: 'Travel', slug: 'travel' },
  ];

  // Static nav items
  const staticNavItems = [
    ['Home', '/'],
    ['Blog', '/blog'],
  ];

  // Combine static nav items with static blog categories
  const navItems = [
    ...staticNavItems,
    ...STATIC_CATEGORIES.map(category => [
      category.name,
      `/blog/category/${category.slug}`
    ])
  ];

  // Prevent hydration mismatch by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Hide header on all /admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const isStorePage = pathname?.startsWith('/store/');

  return (
    <div className={isStorePage ? "w-full" : "pt-6 px-4 md:px-6 lg:px-8"}>
      <header className={`sticky top-0 z-50 w-full bg-gradient-to-r from-background-elevated/95 via-background-elevated/98 to-background-elevated/95 backdrop-blur-xl transition-all duration-300 ${isStorePage
        ? "border-b border-border/30 shadow-md"
        : "border border-border/30 shadow-2xl rounded-2xl mx-auto max-w-7xl"
        }`}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-10">
          <div className="flex h-20 items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center group">
                <div className="relative p-2 transition-all duration-300 group-hover:scale-105">
                  <Image
                    src={brand.logoPath}
                    alt={`${brand.siteName} Logo`}
                    width={200}
                    height={200}
                    priority
                    className="w-40 h-40 transition-transform duration-300"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-2">
              {/* Static Navigation Items */}
              {staticNavItems.map(([name, href]) => (
                <Link
                  key={name}
                  href={href}
                  className={`relative px-4 py-2 text-foreground-secondary hover:text-foreground transition-all duration-300 group ${pathname === href ? 'text-foreground' : ''
                    }`}
                >
                  <span className="relative z-10 font-medium">{name}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 h-0.5 bg-gradient-to-r from-blue-400 to-purple-600 transition-all duration-300 ${pathname === href ? 'w-full' : 'w-0 group-hover:w-full'
                    }`} />
                </Link>
              ))}

              {/* Categories Dropdown */}
              {STATIC_CATEGORIES.length > 0 && (
                <div className="relative group">
                  <button
                    className="relative px-4 py-2 text-foreground-secondary hover:text-foreground transition-all duration-300 group flex items-center space-x-1"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-label="Blog categories menu"
                  >
                    <span className="relative z-10 font-medium">Categories</span>
                    <svg className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className="absolute top-full left-0 mt-2 w-64 bg-background-elevated/95 backdrop-blur-md border border-border/50 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50"
                    role="menu"
                    aria-label="Blog categories"
                  >
                    <div className="p-2">
                      {STATIC_CATEGORIES.map((category) => (
                        <Link
                          key={category._id}
                          href={`/blog/category/${category.slug}`}
                          className="block px-4 py-3 text-foreground-secondary hover:text-foreground hover:bg-gradient-to-r hover:from-button-blue/20 hover:to-primary/20 rounded-lg transition-all duration-300 group/item focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background-elevated"
                          role="menuitem"
                          aria-label={`View ${category.name} blog posts`}
                        >
                          <span className="font-medium">{category.name}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
              <SearchBar className="w-full" />
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300"
              >
                {isSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
              </button>





              {/* User Menu - Desktop */}
              {isHydrated && isAuthenticated && (
                <div className="hidden lg:flex items-center space-x-3">
                  <div className="text-sm text-foreground-secondary">
                    Welcome, <span className="text-foreground font-medium">{user?.name}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center space-x-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 px-3 py-2 rounded-lg transition-all duration-300 group"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              )}

              {/* Mobile Menu */}
              <HeaderMobileMenu
                navItems={navItems}
                pathname={pathname}
                isHydrated={isHydrated}
                isAuthenticated={isAuthenticated}
                user={user}
                logout={logout}
              />
            </div>
          </div>

          {/* Mobile Search Bar */}
          {isSearchOpen && (
            <div className="md:hidden py-4 border-t border-gray-800/50">
              <SearchBar
                className="w-full"
                isMobile={true}
                onClose={() => setIsSearchOpen(false)}
              />
            </div>
          )}
        </div>

        {/* Notification Toast */}
        <NotificationToast />
      </header>
    </div>
  );
}
