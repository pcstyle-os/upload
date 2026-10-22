"use client";

// Dithered aurora wallpaper and dither chrome, ported from pcstyle.dev
// (homepage src/components/Dither.astro and lab/desktop/wm.ts): curtains of
// light drawn one pixel per cell through a Bayer 8x8 threshold and scaled up
// crisp. Also paints the title-bar patterns (--desk-pat*) and the two-tone
// fill of [data-dither-text]. Colours come from the --dither-* tokens in
// globals.css. Decorative only.

import { useEffect, useRef } from "react";

const B8 = [0,32,8,40,2,34,10,42,48,16,56,24,50,18,58,26,12,44,4,36,14,46,6,38,60,28,52,20,62,30,54,22,
            3,35,11,43,1,33,9,41,51,19,59,27,49,17,57,25,15,47,7,39,13,45,5,37,63,31,55,23,61,29,53,21];
const TH = Float32Array.from(B8, (v) => (v + 0.5) / 64);

type RGB = [number, number, number];
const WHITE: RGB = [255, 255, 255];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const pack = (c: RGB | null) =>
  c ? ((255 << 24) | (Math.round(c[2]) << 16) | (Math.round(c[1]) << 8) | Math.round(c[0])) >>> 0 : 0;

function tokens() {
  const probe = document.createElement("canvas").getContext("2d")!;
  const parse = (css: string): RGB => {
    probe.fillStyle = "#000";
    probe.fillStyle = css;
    const n = parseInt((probe.fillStyle as string).slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const cs = getComputedStyle(document.documentElement);
  const tok = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    paper: parse(tok("--dither-paper", "#0a0a0b")),
    ink: parse(tok("--dither-ink", "#e45aa3")),
    tint: parse(tok("--dither-tint", "#9d5cff")),
    dim: parse(tok("--dither-dim", "#2a1a4d")),
    fg: parse(tok("--fg", "#e8e6e3")),
    cell: parseFloat(tok("--dither-cell", "2")) || 2,
  };
}

// an 8x8 tile, tone 0..1 thresholded through the matrix, as a CSS url()
function tilePattern(tone: number, b: RGB) {
  const c = document.createElement("canvas");
  c.width = 8; c.height = 8;
  const cx = c.getContext("2d")!, im = cx.createImageData(8, 8), buf = new Uint32Array(im.data.buffer);
  const B = pack(b);
  for (let i = 0; i < 64; i++) buf[i] = tone > TH[i] ? B : 0;
  cx.putImageData(im, 0, 0);
  return `url(${c.toDataURL()})`;
}

// flat two-tone dither clipped to the letters (see .dtext in globals.css)
function ditherText(el: HTMLElement, a: RGB, b: RGB) {
  const fs = parseFloat(getComputedStyle(el).fontSize);
  const cell = Math.max(2, Math.round(fs / 11));
  const r = el.getBoundingClientRect();
  const W = Math.max(1, Math.ceil(r.width / cell)), H = Math.max(1, Math.ceil(r.height / cell));
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const cx = c.getContext("2d")!;
  const im = cx.createImageData(W, H), buf = new Uint32Array(im.data.buffer);
  const A = pack(a), B = pack(b);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const u = x / W, v = y / H;
    const tone = 0.42 + 0.1 * Math.sin(u * 9 + v * 5) * Math.sin(v * 11 - u * 3);
    buf[y * W + x] = tone > TH[((y & 7) << 3) + (x & 7)] ? B : A;
  }
  cx.putImageData(im, 0, 0);
  el.style.backgroundImage = `url(${c.toDataURL()})`;
  el.style.backgroundSize = `${W * cell}px ${H * cell}px`;
  el.classList.add("dtext");
}

export function Aurora({ height = 0.42, curtains = 5, stillTime = 11 }: { height?: number; curtains?: number; stillTime?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current!;
    const host = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    const T = tokens();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    // chrome patterns, same tones as the homepage desktop
    const root = document.documentElement.style;
    root.setProperty("--desk-pat", tilePattern(0.3, mix(T.dim, T.paper, 0.2)));
    root.setProperty("--desk-pat-on", tilePattern(0.5, mix(T.dim, T.tint, 0.45)));
    root.setProperty("--desk-edge", tilePattern(0.5, mix(T.tint, T.paper, 0.35)));
    root.setProperty("--desk-pat-size", "16px 16px");

    const texts = Array.from(document.querySelectorAll<HTMLElement>("[data-dither-text]"));
    const paintTexts = () => texts.forEach((el) => ditherText(el, T.fg, T.ink));
    paintTexts();
    document.fonts?.ready.then(paintTexts);

    // transparent paper → dim → fringe → edge → pale core
    const pal = [
      null,
      mix(T.dim, T.paper, 0.1),
      mix(T.dim, T.tint, 0.38),
      mix(T.tint, T.dim, 0.12),
      mix(T.ink, T.paper, 0.06),
      mix(T.ink, WHITE, 0.65),
    ].map(pack);
    const N = pal.length - 1;
    const o = { cell: T.cell, curtains, height, spread: 0.08, sway: 1.1, turbulence: 0.6, rays: 14, length: 0.55, glow: 0.9, intensity: 0.95, shimmer: 0.2, drift: 0.35 };

    let W = 0, H = 0;
    let img: ImageData, buf: Uint32Array, idx: Uint8Array, col: Float32Array;
    let glowLut: Float32Array, belowLut: Float32Array, rayLut: Float32Array[] = [];
    let stars: number[] = [];
    let pu = 0.5, pv = 0.5, pk = 0;
    const pointer = { x: 0, y: 0, moved: 0 };
    const t0 = performance.now();
    const time = () => stillTime + (performance.now() - t0) / 1000;

    function draw(t: number) {
      const sin = Math.sin;
      const r = host.getBoundingClientRect();
      const inside = pointer.moved > 0 && performance.now() - pointer.moved < 4000 &&
        pointer.x >= r.left && pointer.x <= r.right && pointer.y >= r.top && pointer.y <= r.bottom;
      pu += ((inside ? (pointer.x - r.left) / r.width : pu) - pu) * 0.12;
      pv += ((inside ? 1 - (pointer.y - r.top) / r.height : pv) - pv) * 0.12;
      pk += ((inside ? 1 : 0) - pk) * 0.08;

      for (let x = 0; x < W; x++) {
        col.fill(0);
        const u = x / W;
        const un = u * 6.2 + t * o.drift * 0.05;
        const du = u - pu;
        const bump = pk * Math.exp(-(du * du) / 0.012);
        for (let i = 0; i < o.curtains; i++) {
          const base = o.height + i * o.spread;
          const s = o.sway * (0.07 * sin(un * 0.85 + t * 0.11 + i * 1.9) + 0.035 * sin(un * 2.1 - t * 0.17 + i * 0.7));
          const tb = o.turbulence * (0.009 * sin(un * 8.5 + t * 0.8 + i * 2.1) + 0.005 * sin(un * 17 - t * 1.1 + i));
          const lean = bump * (pv - base) * 0.45 * Math.pow(0.7, i);
          const er = Math.floor((1 - (base + s + tb + lean)) * H);
          let env = 0.5 + 0.5 * sin(un * 0.62 + i * 2.4 + t * 0.05);
          env = 0.22 + 0.78 * env * env * (3 - 2 * env);
          const rp = un * o.rays + sin(un * 1.6 + t * 0.2 + i) * 1.6 + t * 0.12 * (i % 2 ? 1 : -1);
          const r1 = 0.5 + 0.5 * sin(rp), r2 = 0.5 + 0.5 * sin(rp * 2.3 + 1.3 + t * 0.3);
          const ray = 0.08 + 0.92 * (r1 * r1 * r1 * r1 * 0.7 + r2 * r2 * 0.3);
          const shim = 1 - o.shimmer * (0.5 + 0.5 * sin(un * 4 - t * 1.4 + i * 1.3));
          const amp = o.intensity * Math.pow(0.66, i) * env * shim * (1 + 0.9 * bump);
          const gA = o.glow * amp, rA = ray * 0.7 * amp;
          const rl = rayLut[i];
          for (let dy = 1; dy < belowLut.length; dy++) {
            const y = er + dy;
            if (y >= 0 && y < H) col[y] += gA * belowLut[dy];
          }
          for (let dy = 0; dy < rl.length; dy++) {
            const y = er - dy;
            if (y < 0) break;
            if (y < H) col[y] += rA * rl[dy] + (dy < glowLut.length ? gA * glowLut[dy] : 0);
          }
        }
        const xm = x & 7;
        for (let y = 0; y < H; y++) {
          const c = col[y];
          let lv = 0;
          if (c > 0.004) {
            const v = (1 - Math.exp(-2 * c)) * N;
            lv = v | 0;
            if (v - lv > TH[((y & 7) << 3) + xm]) lv++;
            if (lv > N) lv = N;
          }
          const p = y * W + x;
          idx[p] = lv;
          buf[p] = pal[lv];
        }
      }
      for (let j = 0; j < stars.length; j += 2) {
        const q = stars[j];
        if (idx[q] !== 0) continue;
        const tw = sin(t * 0.7 + stars[j + 1] * 3);
        if (tw > 0.2) buf[q] = pal[tw > 0.92 ? 5 : 1];
      }
      ctx.putImageData(img, 0, 0);
    }

    function resize() {
      const r = host.getBoundingClientRect();
      const nw = Math.max(1, Math.ceil(r.width / o.cell)), nh = Math.max(1, Math.ceil(r.height / o.cell));
      if (nw === W && nh === H) return;
      W = nw; H = nh;
      canvas.width = W; canvas.height = H;
      canvas.style.width = `${W * o.cell}px`;
      canvas.style.height = `${H * o.cell}px`;
      img = ctx.createImageData(W, H);
      buf = new Uint32Array(img.data.buffer);
      idx = new Uint8Array(W * H);
      col = new Float32Array(H);
      const glowR = Math.max(1.2, H * 0.012), belowR = Math.max(1, H * 0.008);
      glowLut = Float32Array.from({ length: Math.ceil(glowR * 6) + 1 }, (_, i) => Math.exp(-i / glowR));
      belowLut = Float32Array.from({ length: Math.ceil(belowR * 5) + 1 }, (_, i) => Math.exp(-i / belowR));
      rayLut = [];
      for (let i = 0; i < o.curtains; i++) {
        const len = Math.max(3, H * o.length * 0.36 * (1 + 0.2 * i));
        rayLut.push(Float32Array.from({ length: Math.ceil(len * 3.2) + 1 }, (_, k) => Math.exp(-k / len) * (1 - 0.55 * Math.exp(-k / 2))));
      }
      stars = [];
      let seed = 7;
      for (let i = 0, n = Math.round((W * H) / 420); i < n; i++) {
        seed = (seed * 16807) % 2147483647; const sx = seed % W;
        seed = (seed * 16807) % 2147483647; const sy = seed % Math.max(1, Math.floor(H * 0.42));
        seed = (seed * 16807) % 2147483647;
        stars.push(sy * W + sx, (seed % 628) / 100);
      }
      draw(reduce.matches ? stillTime : time());
    }

    let raf = 0, last = 0;
    const loop = (now: number) => {
      if (now - last >= 33) { last = now; draw(time()); } // ~30fps
      raf = requestAnimationFrame(loop);
    };
    const update = () => {
      cancelAnimationFrame(raf);
      raf = 0;
      if (reduce.matches) draw(stillTime);
      else if (!document.hidden) raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => { pointer.x = e.clientX; pointer.y = e.clientY; pointer.moved = performance.now(); };

    resize();
    update();
    const ro = new ResizeObserver(() => { resize(); paintTexts(); });
    ro.observe(host);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("visibilitychange", update);
    reduce.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", update);
      reduce.removeEventListener("change", update);
    };
  }, [height, curtains, stillTime]);

  return (
    <div className="sky" aria-hidden="true">
      <canvas ref={ref} />
    </div>
  );
}
