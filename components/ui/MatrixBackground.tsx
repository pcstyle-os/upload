"use client";

import React, { useEffect, useRef } from "react";

export const MatrixBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        const columns = Math.floor(width / 20);
        const drops: number[] = new Array(columns).fill(1);

        // Cyberpunk chars
        const chars = "01UPLOAD_X#<>?[]{}⬆⬇";

        const draw = () => {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fillRect(0, 0, width, height);

            ctx.font = '12px "JetBrains Mono", monospace';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                const xPos = i * 20;
                const yPos = drops[i] * 20;
                const dist = Math.hypot(
                    xPos - mouseRef.current.x,
                    yPos - mouseRef.current.y
                );

                if (dist < 150) {
                    ctx.fillStyle = "#ffffff";
                    ctx.globalAlpha = 1;
                } else {
                    ctx.fillStyle = "#ff00ff";
                    ctx.globalAlpha = Math.random() > 0.9 ? 1 : 0.15;
                }

                ctx.fillText(text, xPos, yPos);

                if (drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const interval = setInterval(draw, 50);

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener("resize", handleResize);

        return () => {
            clearInterval(interval);
            window.removeEventListener("resize", handleResize);
        };
    }, []);

    return (
        <div className="fixed inset-0 pointer-events-none z-0 opacity-20">
            <canvas ref={canvasRef} className="w-full h-full" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,0,0,0),rgba(0,0,0,1))]" />
        </div>
    );
};
