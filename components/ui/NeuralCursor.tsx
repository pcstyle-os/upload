"use client";

import React, { useState, useEffect } from "react";

export const NeuralCursor = () => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);
    const [isClicking, setIsClicking] = useState(false);

    useEffect(() => {
        // Check for touch device
        if ("ontouchstart" in window) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const handleMouseDown = () => setIsClicking(true);
        const handleMouseUp = () => setIsClicking(false);
        const handleMouseLeave = () => setIsVisible(false);

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    if (!isVisible) return null;

    return (
        <>
            {/* Main cursor */}
            <div
                className="fixed pointer-events-none z-[10000] transition-transform duration-75"
                style={{
                    left: position.x,
                    top: position.y,
                    transform: `translate(-50%, -50%) scale(${isClicking ? 0.7 : 1})`,
                }}
            >
                <div
                    className={`w-4 h-4 border-2 border-[#ff00ff] rotate-45 transition-all duration-150 ${isClicking ? "bg-[#ff00ff]" : "bg-transparent"
                        }`}
                    style={{
                        boxShadow: isClicking
                            ? "0 0 20px #ff00ff, 0 0 40px #ff00ff"
                            : "0 0 10px #ff00ff66",
                    }}
                />
            </div>

            {/* Trailing effect */}
            <div
                className="fixed pointer-events-none z-[9999] opacity-50"
                style={{
                    left: position.x,
                    top: position.y,
                    transform: "translate(-50%, -50%)",
                    transition: "all 0.15s ease-out",
                }}
            >
                <div className="w-8 h-8 border border-[#ff00ff]/30 rotate-45" />
            </div>
        </>
    );
};
