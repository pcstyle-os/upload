"use client";

// A still dither vignette for the file page: empty in the middle, a few
// Bayer 8x8 dots thickening toward the edges, so the eye lands on the file.
// Same matrix and tokens as Aurora.tsx. Decorative only.

import { useEffect, useRef } from "react";

const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
            3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];

export function Mat() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext("2d")!;
    const cs = getComputedStyle(document.documentElement);
    const color = (name: string, fallback: string) => {
      ctx.fillStyle = cs.getPropertyValue(name).trim() || fallback;
      const n = parseInt((ctx.fillStyle as string).slice(1), 16);
      return (255 << 24 | (n & 255) << 16 | (n >> 8 & 255) << 8 | n >> 16) >>> 0;
    };
    const dim = color("--dither-dim", "#2a1a4d");
    const tint = color("--accent", "#8c1862");
    const cell = 2;

    // Each edge ramps in over a fixed width in px; the corners combine the
    // two ramps instead of meeting at a seam.
    const ramp = 48;
    const edge = (d: number) => Math.max(0, 1 - d / ramp) ** 2;
    const draw = () => {
      const host = canvas.parentElement!;
      const W = Math.ceil(host.clientWidth / cell), H = Math.ceil(host.clientHeight / cell);
      canvas.width = W; canvas.height = H;
      canvas.style.width = `${W * cell}px`;
      canvas.style.height = `${H * cell}px`;
      const img = ctx.createImageData(W, H), buf = new Uint32Array(img.data.buffer);
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const clear = (1 - edge(x)) * (1 - edge(W - 1 - x)) * (1 - edge(y)) * (1 - edge(H - 1 - y));
        const tone = (1 - clear) * 0.42;
        const th = (B8[((y & 7) << 3) + (x & 7)] + 0.5) / 64;
        if (tone > th) buf[y * W + x] = tone - th > 0.28 ? tint : dim;
      }
      ctx.putImageData(img, 0, 0);
    };
    draw();
    addEventListener("resize", draw);
    return () => removeEventListener("resize", draw);
  }, []);

  return <div className="sky" aria-hidden="true"><canvas ref={ref} /></div>;
}
