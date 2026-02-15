'use client';

import { useState, useRef } from 'react';

interface DragRevealProps {
    code: string;
}

const DragReveal = ({ code }: DragRevealProps) => {
    const [offsetY, setOffsetY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);
    // We track the initial offset at the start of the drag (usually 0) to allow for "resume" if we wanted,
    // but here we always want to pull from current position.

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.preventDefault(); // Prevent text selection/scrolling
        setIsDragging(true);
        startY.current = e.clientY;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!isDragging) return;

        // Calculate how far we've moved from the start point
        const delta = e.clientY - startY.current;

        // We want to limit the drag:
        // Max Up: -40px (the height of the container, revealing full code)
        // Max Down: 0px (the resting state)
        // Dragging UP produces negative delta
        const newY = Math.max(-40, Math.min(0, delta));
        setOffsetY(newY);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
        setIsDragging(false);
        setOffsetY(0); // Snap back to cover
        e.currentTarget.releasePointerCapture(e.pointerId);
    };

    return (
        <div className="relative h-10 w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50 select-none cursor-grab active:cursor-grabbing">
            {/* Background (Real Code) - The Treasure */}
            <div className="absolute inset-0 flex items-center justify-center font-mono font-bold text-slate-800 bg-blue-50">
                {code}
            </div>

            {/* Foreground (Mask) - The Curtain */}
            <div
                className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 font-mono text-slate-500 hover:bg-slate-50 transition-colors shadow-sm"
                style={{
                    transform: `translateY(${offsetY}px)`,
                    // Disable transition while dragging for 1:1 feel, enable for snap-back
                    transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)'
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                *****{code.slice(-3)}
                {/* Visual Cue for "Pull Up" */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-200/50 flex justify-center items-end pb-[1px]">
                    <div className="w-8 h-0.5 bg-slate-300 rounded-full"></div>
                </div>
            </div>
        </div>
    );
};

export default DragReveal;
