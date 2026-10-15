import { type Plate, makePlate } from "./model";
import { parseDimension } from "./validation";
export const STORAGE_KEY = "r24-plates";
export function restore(): Plate[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    if (
      data?.version !== 1 ||
      !Array.isArray(data.plates) ||
      data.plates.length < 1 ||
      data.plates.length > 10
    )
      throw Error();
    const ids = new Set<string>();
    for (const p of data.plates) {
      if (
        !p ||
        typeof p.id !== "string" ||
        !p.id ||
        ids.has(p.id) ||
        typeof p.width !== "number" ||
        typeof p.height !== "number" ||
        parseDimension(String(p.width), "width") === null ||
        parseDimension(String(p.height), "height") === null
      )
        throw Error();
      ids.add(p.id);
    }
    return data.plates.map((p: Plate) => ({
      id: p.id,
      width: p.width,
      height: p.height,
    }));
  } catch {
    return [makePlate()];
  }
}
export function persist(plates: Plate[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, plates }));
    return true;
  } catch {
    return false;
  }
}
