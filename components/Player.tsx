"use client";

import { useRef, useState } from "react";
import { Pix } from "./Pix";

const clock = (s: number) => {
  if (!Number.isFinite(s)) return "--:--";
  s = Math.floor(s);
  const h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60, sec = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
};

// A pixel media player for video and audio: one control row under the
// media, a square scrubber with a dithered buffered band, and keyboard
// control (space or k to play, arrows to seek, m to mute, f for fullscreen).
export function Player({ kind, src, name, onError }: {
  kind: "video" | "audio";
  src: string;
  name: string;
  onError: () => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(NaN);
  const [buffered, setBuffered] = useState(0);
  const [muted, setMuted] = useState(false);
  const [waiting, setWaiting] = useState(false);

  const el = () => media.current!;
  const toggle = () => { const m = el(); if (m.paused || m.ended) void m.play().catch(() => {}); else m.pause(); };
  const seek = (to: number) => { const m = el(); if (Number.isFinite(m.duration)) m.currentTime = Math.min(Math.max(to, 0), m.duration); };
  const mute = () => { el().muted = !el().muted; };
  const full = () => {
    const v = el() as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (box.current?.requestFullscreen) void box.current.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else v.webkitEnterFullscreen?.();
  };
  const progress = () => {
    const m = el();
    setTime(m.currentTime);
    const b = m.buffered;
    setBuffered(b.length ? b.end(b.length - 1) : 0);
  };
  const pct = (v: number) => (Number.isFinite(duration) && duration > 0 ? `${(v / duration) * 100}%` : "0%");

  const events = {
    src, preload: "metadata", "aria-label": name, onError,
    onPlay: () => setPlaying(true), onPause: () => setPlaying(false), onEnded: () => setPlaying(false),
    onLoadedMetadata: () => { setDuration(el().duration); progress(); },
    onDurationChange: () => setDuration(el().duration),
    onTimeUpdate: progress, onProgress: progress,
    onWaiting: () => setWaiting(true), onPlaying: () => setWaiting(false), onCanPlay: () => setWaiting(false),
    onVolumeChange: () => setMuted(el().muted),
  } as const;

  return <div ref={box} tabIndex={-1} className={`player ${kind}`} onKeyDown={event => {
    if (event.target instanceof HTMLButtonElement && (event.key === " " || event.key === "Enter")) return;
    const step = { ArrowLeft: -5, ArrowRight: 5, j: -10, l: 10 }[event.key];
    if (event.key === " " || event.key === "k") toggle();
    else if (step) seek(el().currentTime + step);
    else if (event.key === "m") mute();
    else if (event.key === "f" && kind === "video") full();
    else return;
    event.preventDefault();
  }}>
    {kind === "video"
      ? <video ref={media} className="screen" playsInline onClick={toggle} {...events} />
      : <audio ref={media} {...events} />}
    {kind === "audio" && <button type="button" className="big-play" onClick={toggle} aria-label={playing ? "pause" : "play"}>
      <Pix name={playing ? "pause" : "play"} />
    </button>}
    <div className="controls">
      {kind === "video" && <button type="button" className="ico" onClick={toggle} aria-label={playing ? "pause" : "play"}>
        <Pix name={playing ? "pause" : "play"} />
      </button>}
      <span className="time" aria-hidden="true">{waiting ? "loading" : clock(time)}<span> / {clock(duration)}</span></span>
      <div className="scrub" style={{ "--played": pct(time), "--loaded": pct(buffered) } as React.CSSProperties}>
        <span className="loaded" />
        <span className="played" />
        <input type="range" min={0} max={Number.isFinite(duration) ? duration : 0} step="any" value={time}
          aria-label="seek" aria-valuetext={`${clock(time)} of ${clock(duration)}`}
          onChange={event => seek(Number(event.target.value))}
          onKeyDown={event => {
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              event.stopPropagation();
              seek(el().currentTime + (event.key === "ArrowLeft" ? -5 : 5));
            }
          }} />
      </div>
      <button type="button" className="ico" onClick={mute} aria-label={muted ? "unmute" : "mute"} aria-pressed={muted}>
        <Pix name={muted ? "mute" : "vol"} />
      </button>
      {kind === "video" && <button type="button" className="ico" onClick={full} aria-label="fullscreen">
        <Pix name="full" />
      </button>}
    </div>
  </div>;
}
