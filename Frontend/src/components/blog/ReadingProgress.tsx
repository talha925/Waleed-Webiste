'use client';

import { useEffect, useState } from 'react';

/**
 * ReadingProgress Component
 * Displays a fixed progress bar at the top of the page showing reading progress
 */
export default function ReadingProgress() {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const updateProgress = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight;
            const scrollTop = window.scrollY;

            // Calculate scroll progress as a percentage
            const totalScrollableHeight = documentHeight - windowHeight;
            const currentProgress = (scrollTop / totalScrollableHeight) * 100;

            setProgress(Math.min(100, Math.max(0, currentProgress)));
        };

        // Update on scroll
        window.addEventListener('scroll', updateProgress);
        // Update on resize (in case content changes)
        window.addEventListener('resize', updateProgress);
        // Initial calculation
        updateProgress();

        return () => {
            window.removeEventListener('scroll', updateProgress);
            window.removeEventListener('resize', updateProgress);
        };
    }, []);

    return (
        <div
            className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500/10 to-indigo-500/10"
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
        >
            <div
                className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 transition-all duration-150 ease-out shadow-lg shadow-blue-500/50"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
