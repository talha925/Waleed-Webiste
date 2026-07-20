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
import NotificationToast from "@/components/ui/NotificationToast";
import HeaderMobileMenu from "@/components/HeaderMobileMenu";

interface HeaderProps {
  categories?: any[];
}

export default function Header() {
  const { user, isAuthenticated, logout, isLoading } = useUnifiedAuth();
  const brand = useBrand();
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // 🏛️ Hardcoded Static Categories (Senior Dev Choice: Reliability & Speed)
  const navItems = [
    ['Home', '/'],
    ['Health and Beauty', '/blog/category/health-and-beauty'],
    ['Home and Tech', '/blog/category/home-and-tech'],
    ['Lifestyle', '/blog/category/lifestyle'],
    ['Sports and Fitness', '/blog/category/sports-and-fitness'],
    ['Travel', '/blog/category/travel'],
    ['Blogs', '/blog'],
  ];

  const categoriesItems = navItems.slice(1, -1); // Extract only the categories for the middle group

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

            {/* Desktop Navigation - Premium Minimalist Design (Visible from 1024px) */}
            <nav className="hidden lg:flex items-center p-1 bg-background-elevated/40 backdrop-blur-xl border border-white/5 rounded-2xl shadow-inner-white">
              {/* Home Link */}
              <Link
                href="/"
                className={`relative px-3 py-2 hover:text-foreground transition-all duration-300 group ${pathname === '/' ? 'text-foreground' : 'text-foreground-secondary'}`}
              >
                <span className="relative z-10 text-[12px] font-bold tracking-wide uppercase">Home</span>
                {pathname === '/' && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl shadow-[0_0_15px_rgba(255,255,255,0.05)]" />
                )}
              </Link>

              {/* Minimal Divider */}
              <div className="w-px h-3 bg-white/10 mx-1.5" />

              {/* Categories Group */}
              <div className="flex items-center space-x-0.5">
                {categoriesItems.map(([name, href]) => (
                  <Link
                    key={name as string}
                    href={href as string}
                    className={`relative px-2.5 py-1.5 hover:text-foreground transition-all duration-300 group whitespace-nowrap ${pathname === href ? 'text-foreground' : 'text-foreground-secondary'}`}
                  >
                    <span className="relative z-10 text-[12px] font-semibold tracking-tight">{name as string}</span>
                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center rounded-full opacity-50" />
                  </Link>
                ))}
              </div>

              {/* Minimal Divider */}
              <div className="w-px h-3 bg-white/10 mx-1.5" />

              {/* Blog Link - Placed at the end */}
              <Link
                href="/blog"
                className={`relative px-3 py-2 hover:text-foreground transition-all duration-300 group ${pathname === '/blog' ? 'text-foreground' : 'text-foreground-secondary'}`}
              >
                <span className="relative z-10 text-[12px] font-bold tracking-wide uppercase">Blogs</span>
                {pathname === '/blog' && (
                  <div className="absolute inset-0 bg-white/5 rounded-xl" />
                )}
              </Link>
            </nav>

            {/* Space Filler for fixed spacing */}
            <div className="flex-1 lg:hidden" />

            {/* Desktop Search Bar - Always visible on larger screens where space allows */}
            <div className="hidden md:flex items-center flex-1 justify-end mx-6 max-w-md">
              <div className="w-full animate-in fade-in duration-500">
                <SearchBar className="w-full" />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-3">
              {/* Mobile Search Toggle */}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="md:hidden p-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300"
                aria-label={isSearchOpen ? "Close mobile search" : "Open mobile search"}
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
