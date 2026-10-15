import { describe, it, expect } from "vitest";
import {
  formatDimension,
  parseUnitDimension,
  restorePreferences,
} from "./units";
import { reducer, type Plate } from "./model";
describe("units and locales", () => {
  it("formats both locales without grouping", () => {
    expect(formatDimension(25.4, "in", "de-DE")).toBe("10");
    expect(formatDimension(30, "in", "de-DE")).toBe("11,811");
    expect(formatDimension(30, "in", "en-US")).toBe("11.811");
    expect(formatDimension(125.5, "cm", "de-DE")).toBe("125,5");
  });
  it("converts either decimal separator to canonical centimetres", () => {
    expect(parseUnitDimension("10,5", "width", "in")).toBe(26.67);
    expect(parseUnitDimension("10.5", "width", "in")).toBe(26.67);
  });
  it("accepts displayed inclusive bounds after centimetre rounding", () => {
    expect(parseUnitDimension("7.874", "width", "in")).toBe(20);
    expect(parseUnitDimension("118.1102", "width", "in")).toBe(300);
    expect(parseUnitDimension("11.811", "height", "in")).toBe(30);
    expect(parseUnitDimension("50.3937", "height", "in")).toBe(128);
  });
  it.each(["7", "119", "10,1.2", "10in", "10.12345", "Infinity"])(
    "rejects invalid inches %s",
    (raw) => expect(parseUnitDimension(raw, "width", "in")).toBeNull(),
  );
  it("does not accumulate conversion drift for canonical cm", () => {
    for (const cm of [20, 20.01, 30, 125.5, 299.99, 300])
      expect(
        parseUnitDimension(formatDimension(cm, "in", "de-DE"), "width", "in"),
      ).toBe(cm);
  });
  it("recovers malformed preferences", () => {
    localStorage.setItem("r24-preferences", "broken");
    expect(restorePreferences()).toEqual({ unit: "cm", locale: "de-DE" });
  });
});
describe("reorder", () => {
  const plates: Plate[] = [
    { id: "a", width: 50, height: 128 },
    { id: "b", width: 100, height: 80 },
    { id: "c", width: 150, height: 30 },
  ];
  it("moves stable plates in either direction and preserves original state", () => {
    const result = reducer(plates, { type: "move", id: "a", to: 2 });
    expect(result.map((p) => p.id)).toEqual(["b", "c", "a"]);
    expect(result[2]).toBe(plates[0]);
    expect(plates.map((p) => p.id)).toEqual(["a", "b", "c"]);
    expect(reducer(result, { type: "move", id: "a", to: 0 })).toEqual(plates);
  });
  it("ignores invalid moves", () => {
    for (const to of [-1, 3, 1.5, NaN])
      expect(reducer(plates, { type: "move", id: "a", to })).toBe(plates);
    expect(reducer(plates, { type: "move", id: "missing", to: 0 })).toBe(
      plates,
    );
  });
});
