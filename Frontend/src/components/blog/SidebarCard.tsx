import React from 'react';

interface SidebarCardProps {
    title: string;
    icon: string;
    children: React.ReactNode;
    className?: string;
}

export default function SidebarCard({ title, icon, children, className = '' }: SidebarCardProps) {
    return (
        <aside className={`sticky top-24 h-fit ${className}`}>
            <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-6">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white text-sm font-bold">{icon}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">
                        {title}
                    </h3>
                </div>
                {children}
            </div>
        </aside>
    );
}
