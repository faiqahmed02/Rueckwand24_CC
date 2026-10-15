import type { Plate } from "./model";
export function layout(plates: Plate[]) {
  const height = Math.max(...plates.map((p) => p.height));
  let x = 0;
  return {
    width: plates.reduce((s, p) => s + p.width, 0),
    height,
    plates: plates.map((p) => {
      const rect = { ...p, x, y: height - p.height };
      x += p.width;
      return rect;
    }),
  };
}
export function cover(iw: number, ih: number, height: number) {
  const scale = Math.max(300 / iw, height / ih);
  return {
    width: iw * scale,
    height: ih * scale,
    x: (300 - iw * scale) / 2,
    y: (height - ih * scale) / 2,
  };
}
export function motifX(x: number, width = 300) {
  x += Math.max(0, (300 - width) / 2);
  const segment = Math.floor(x / 300),
    offset = x - segment * 300;
  return segment % 2 === 0 ? offset : 300 - offset;
}
export function segments(width: number) {
  return Array.from({ length: Math.ceil(width / 300) }, (_, i) => ({
    x: i * 300,
    mirrored: i % 2 === 1,
  }));
}
