// Sizes a picture (image or video frame) to whole pixels inside the room it
// has. The size keeps the room's parity, so centring never lands on half a
// pixel. Never scales up.

// On desktop the stage is a definite box; on mobile the page scrolls, so the
// cap is the element's own (pixel) max-height.
export function room(stage: HTMLElement, el: HTMLElement, reserved = 0): [number, number] {
  const desktop = matchMedia("(min-width: 560px)").matches;
  const height = desktop ? stage.clientHeight - reserved : parseFloat(getComputedStyle(el).maxHeight) || Infinity;
  return [stage.clientWidth, height];
}

export function fit(width: number, height: number, [roomW, roomH]: [number, number]): [number, number] {
  const scale = Math.min(1, roomW / width, roomH / height);
  let w = Math.floor(width * scale), h = Math.floor(height * scale);
  if ((roomW - w) % 2) w--;
  if (Number.isFinite(roomH) && (roomH - h) % 2) h--;
  return [Math.max(w, 1), Math.max(h, 1)];
}
