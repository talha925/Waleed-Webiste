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

interface HeaderProps {
  categories?: any[];
}

export default function Header({ categories = [] }: HeaderProps) {
  const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();
  const { state } = useApp();
  const brand = useBrand();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fallback Static Categories if none provided
  const STATIC_CATEGORIES = categories.length > 0 ? categories : [
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
                  className={`relative px-4 py-2 hover:text-foreground transition-all duration-300 group ${pathname === href ? 'text-foreground' : 'text-foreground-secondary'
                    }`}
                >
                  <span className="relative z-10 font-bold">{name}</span>
                  <div className={`absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 h-1 bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent transition-all duration-500 rounded-full ${pathname === href ? 'w-[70%]' : 'w-0 group-hover:w-[70%]'
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
                    <span className="relative z-10 font-bold">Categories</span>
                    <svg className="w-4 h-4 transition-transform duration-500 group-hover:rotate-180 text-brand-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                    </svg>
                    <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/10 via-brand-secondary/10 to-brand-accent/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-72 bg-background-elevated/95 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-500 z-50 p-2 overflow-hidden ring-1 ring-black/5"
                    role="menu"
                    aria-label="Blog categories"
                  >
                    <div className="relative z-10 grid grid-cols-1 gap-1">
                      {STATIC_CATEGORIES.map((category) => (
                        <Link
                          key={category._id}
                          href={`/blog/category/${category.slug}`}
                          className="flex items-center space-x-3 px-5 py-4 text-foreground-secondary hover:text-foreground hover:bg-gradient-to-r hover:from-white/10 hover:to-white/5 rounded-2xl transition-all duration-300 group/item relative overflow-hidden"
                          role="menuitem"
                          aria-label={`View ${category.name} blog posts`}
                        >
                          <div className={`w-2 h-2 rounded-full bg-gradient-brand-to-accent opacity-0 group-hover/item:opacity-100 transition-opacity`} />
                          <span className="font-semibold">{category.name}</span>
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 via-brand-secondary/5 to-brand-accent/5 opacity-0 group-hover/item:opacity-100 transition-opacity -z-10" />
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
            <div className="md:hidden py-4 border-t border-border/50">
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
