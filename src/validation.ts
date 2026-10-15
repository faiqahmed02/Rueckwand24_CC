import type { Axis } from "./model";
export const limits = { width: [20, 300], height: [30, 128] } as const;
export function parseDimension(raw: string, axis: Axis): number | null {
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(raw.trim())) return null;
  const n = Number(raw.trim().replace(",", "."));
  const [min, max] = limits[axis];
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}
