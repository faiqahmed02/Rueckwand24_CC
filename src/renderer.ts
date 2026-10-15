import type { Plate } from "./model";
import { layout, cover, segments } from "./geometry";
export function render(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  plates: Plate[],
  width: number,
  height: number,
  dpr: number,
  activeId?: string | null,
) {
  if (width <= 0 || height <= 0) return;
  const g = layout(plates);
  const scale = Math.min(width / g.width, height / g.height);
  const ox = (width - g.width * scale) / 2,
    oy = (height - g.height * scale) / 2;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.translate(ox, oy);
  ctx.scale(scale, scale);
  const active = g.plates.find((plate) => plate.id === activeId);
  if (active) {
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,.24)";
    ctx.shadowBlur = 20 * dpr;
    ctx.shadowOffsetY = 14 * dpr;
    ctx.fillStyle = "#fff";
    ctx.fillRect(active.x, active.y, active.width, active.height);
    ctx.restore();
  }
  // Cover one nominal segment before reflecting it; plate clips never reset motif coordinates.
  const crop = cover(img.naturalWidth, img.naturalHeight, g.height);
  // Clip once to the union of the plates, then draw each motif segment once.
  // Ten plates require at most ten image draws instead of one hundred.
  ctx.save();
  ctx.beginPath();
  for (const p of g.plates) ctx.rect(p.x, p.y, p.width, p.height);
  ctx.clip();
  for (const segment of segments(g.width)) {
    const x = segment.x - Math.max(0, (300 - g.width) / 2);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, 0, 300, g.height);
    ctx.clip();
    ctx.translate(x + (segment.mirrored ? 300 : 0), 0);
    ctx.scale(segment.mirrored ? -1 : 1, 1);
    ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height);
    ctx.restore();
  }
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.85)";
  ctx.lineWidth = 1 / scale;
  for (const p of g.plates.slice(1)) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, g.height);
    ctx.stroke();
  }
}
