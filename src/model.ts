import { parseDimension } from "./validation";
export type Plate = { id: string; width: number; height: number };
export type Axis = "width" | "height";
export const makePlate = (): Plate => ({
  id: crypto.randomUUID(),
  width: 250,
  height: 128,
});
export type Action =
  | { type: "add"; plate: Plate }
  | { type: "remove"; id: string }
  | { type: "move"; id: string; to: number }
  | { type: "resize"; id: string; axis: Axis; value: number };
export function reducer(plates: Plate[], action: Action): Plate[] {
  if (action.type === "move") {
    const from = plates.findIndex((p) => p.id === action.id);
    if (
      from < 0 ||
      !Number.isInteger(action.to) ||
      action.to < 0 ||
      action.to >= plates.length ||
      from === action.to
    )
      return plates;
    const next = [...plates];
    const [plate] = next.splice(from, 1);
    next.splice(action.to, 0, plate);
    return next;
  }
  if (action.type === "add")
    return plates.length < 10 ? [...plates, action.plate] : plates;
  if (action.type === "remove")
    return plates.length > 1
      ? plates.filter((p) => p.id !== action.id)
      : plates;
  if (parseDimension(String(action.value), action.axis) === null) return plates;
  return plates.map((p) =>
    p.id === action.id ? { ...p, [action.axis]: action.value } : p,
  );
}
