"use client";

import { useState, useEffect } from 'react';

export const usePerformanceMode = () => {
    const [isLowPerformance] = useState(() => {
        if (typeof window === 'undefined') return false;

        // Check for user preference first
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return true;

        // Check hardware concurrency
        if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) return true;

        // Check device memory
        // @ts-expect-error: deviceMemory is not yet standard in TS
        if (navigator.deviceMemory && navigator.deviceMemory <= 4) return true;

        return false;
    });

    useEffect(() => {
        // Performance check already done in initializer.
    }, []);

    return isLowPerformance;
};
