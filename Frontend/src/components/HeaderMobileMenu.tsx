'use client';

import React from 'react';
import Image from "next/image";
import Link from "next/link";
import { Menu, LogOut } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { themeClasses } from "@/lib/theme/utils";
import { useBrand } from "@/context/BrandContext";

interface HeaderMobileMenuProps {
    navItems: (string | any)[][]; // [name, href]
    pathname: string;
    isHydrated: boolean;
    isAuthenticated: boolean;
    user: any;
    logout: () => void;
}

export default function HeaderMobileMenu({
    navItems,
    pathname,
    isHydrated,
    isAuthenticated,
    user,
    logout
}: HeaderMobileMenuProps) {
    const brand = useBrand();
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className="lg:hidden p-2 text-foreground-tertiary hover:text-foreground hover:bg-accent/50 rounded-lg transition-all duration-300" aria-label="Toggle mobile menu">
                    <Menu className="h-6 w-6" />
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0 bg-background-elevated border-border">
                <div className="flex flex-col h-full">
                    {/* Mobile Header */}
                    <div className="p-6 border-b border-border">
                        <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center">
                                <Image
                                    src={brand.logoPath}
                                    alt={`${brand.siteName} Logo`}
                                    width={80}
                                    height={80}
                                    priority
                                    className="w-20 h-20"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex-1 p-6">
                        <nav className="space-y-2" role="navigation" aria-label="Mobile navigation menu">
                            {navItems.map(([name, href]) => (
                                <Link
                                    key={name}
                                    href={href}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background-elevated ${pathname === href
                                        ? 'bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30'
                                        : 'text-foreground-secondary hover:text-foreground hover:bg-accent/50'
                                        }`}
                                    aria-current={pathname === href ? 'page' : undefined}
                                >
                                    <span className="font-medium">{name}</span>
                                </Link>
                            ))}
                        </nav>

                        {/* Mobile User Section */}
                        {isHydrated && isAuthenticated && (
                            <div className={`mt-8 pt-6 border-t ${themeClasses.borders.light}`}>
                                <div className="flex items-center space-x-3 mb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full flex items-center justify-center">
                                        <span className={`${themeClasses.text.inverse} font-semibold text-sm`}>
                                            {user?.name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <div className={`${themeClasses.text.primary} font-medium`}>{user?.name}</div>
                                        <div className={`${themeClasses.text.secondary} text-sm`}>User Account</div>
                                    </div>
                                </div>
                                <button
                                    onClick={logout}
                                    className={`w-full flex items-center justify-center space-x-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} hover:${themeClasses.backgrounds.secondary} px-4 py-3 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2`}
                                    aria-label="Logout from your account"
                                >
                                    <LogOut className="w-4 h-4" aria-hidden="true" />
                                    <span className="font-medium">Logout</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
