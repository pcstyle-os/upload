"use client";
import React, { useState, useEffect } from 'react';

const useMousePosition = () => {
    const [mouse, setMouse] = useState({ x: 0, y: 0 });
    useEffect(() => {
        const handle = (e: MouseEvent) => setMouse({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handle);
        return () => window.removeEventListener('mousemove', handle);
    }, []);
    return mouse;
};

export const NeuralCursor = () => {
    const mouse = useMousePosition();
    const [delayedMouse, setDelayedMouse] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const timeout = setTimeout(() => setDelayedMouse(mouse), 50);
        return () => clearTimeout(timeout);
    }, [mouse]);

    return (
        <div className="hidden lg:block pointer-events-none fixed inset-0 z-[500]">
            <div
                className="absolute w-4 h-4 border border-[#ff00ff] rounded-full transition-transform duration-75 ease-out"
                style={{ transform: `translate(${mouse.x - 8}px, ${mouse.y - 8}px)` }}
            />
            <div
                className="absolute w-2 h-2 bg-[#ff00ff] rounded-full blur-[2px] opacity-50"
                style={{ transform: `translate(${delayedMouse.x - 4}px, ${delayedMouse.y - 4}px)` }}
            />
            <svg className="absolute inset-0 w-full h-full">
                <line
                    x1={mouse.x} y1={mouse.y}
                    x2={delayedMouse.x} y2={delayedMouse.y}
                    stroke="#ff00ff" strokeWidth="1" strokeOpacity="0.2"
                />
            </svg>
        </div>
    );
};
