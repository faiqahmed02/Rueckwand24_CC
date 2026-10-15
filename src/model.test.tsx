import { parseDimension } from "./validation";
import { restore, persist, STORAGE_KEY } from "./persistence";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { makePlate, reducer, type Plate } from "./model";
import { layout, motifX, cover, segments } from "./geometry";
import { Dimension } from "./Dimension";
const p: Plate = { id: "a", width: 250, height: 128 };
beforeEach(() => {
  cleanup();
  localStorage.clear();
});
describe("dimensions", () => {
  it.each(["20", "300", "20,25", "20.25"])("accepts width %s", (s) =>
    expect(parseDimension(s, "width")).not.toBeNull(),
  );
  it.each([
    "",
    "-20",
    "19.99",
    "300.01",
    "Infinity",
    "NaN",
    "20cm",
    "20,2.1",
    "1,000",
    "2e2",
    ".5",
    "20.123",
  ])("rejects %s", (s) => expect(parseDimension(s, "width")).toBeNull());
  it("accepts inclusive height bounds", () => {
    expect(parseDimension("30", "height")).toBe(30);
    expect(parseDimension("128", "height")).toBe(128);
    expect(parseDimension("128.01", "height")).toBeNull();
  });
  it("retains raw input and restores previous valid geometry on blur", () => {
    const change = vi.fn();
    const { rerender } = render(
      <Dimension plate={p} axis="width" onChange={change} />,
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "120,5" } });
    expect(change).toHaveBeenLastCalledWith(120.5);
    rerender(
      <Dimension
        plate={{ ...p, width: 120.5 }}
        axis="width"
        onChange={change}
      />,
    );
    fireEvent.change(input, { target: { value: "999" } });
    expect(input).toHaveValue("999");
    expect(input).toHaveAttribute("aria-invalid", "true");
    fireEvent.blur(input);
    expect(input).toHaveValue("120,5");
  });
});
describe("state and storage", () => {
  it("recovers when reading storage is unavailable", () => {
    const spy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw Error("blocked");
      });
    expect(restore()).toEqual([
      expect.objectContaining({ width: 250, height: 128 }),
    ]);
    spy.mockRestore();
  });
  it("rejects duplicate IDs and excessive saved plate counts", () => {
    for (const plates of [
      [p, p],
      Array.from({ length: 11 }, (_, i) => ({ ...p, id: String(i) })),
    ]) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, plates }));
      expect(restore()).toHaveLength(1);
    }
  });

  it("enforces count and valid geometry", () => {
    let state = [p];
    expect(reducer(state, { type: "remove", id: "a" })).toEqual(state);
    for (let i = 0; i < 15; i++)
      state = reducer(state, { type: "add", plate: makePlate() });
    expect(state).toHaveLength(10);
    expect(new Set(state.map((p) => p.id)).size).toBe(10);
    expect(
      reducer(state, { type: "resize", id: "a", axis: "width", value: 999 }),
    ).toEqual(state);
    expect(reducer(state, { type: "remove", id: "a" })).toHaveLength(9);
  });
  it.each([
    "bad",
    "{}",
    '{"version":2,"plates":[]}',
    '{"version":1,"plates":[]}',
    '{"version":1,"plates":[{"id":"a","width":999,"height":128}]}',
  ])("recovers from %s", (raw) => {
    localStorage.setItem(STORAGE_KEY, raw);
    expect(restore()).toEqual([
      expect.objectContaining({ width: 250, height: 128 }),
    ]);
  });
  it("persists only valid state after invalid action", () => {
    const state = reducer([p], {
      type: "resize",
      id: "a",
      axis: "width",
      value: NaN,
    });
    persist(state);
    expect(restore()).toEqual([p]);
  });
  it("handles unavailable storage", () => {
    const spy = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw Error();
      });
    expect(persist([p])).toBe(false);
    spy.mockRestore();
  });
});
describe("shared motif geometry", () => {
  it("uses cumulative positions and shared baseline", () => {
    expect(layout([p, { id: "b", width: 200, height: 60 }])).toMatchObject({
      width: 450,
      height: 128,
      plates: [
        { x: 0, y: 0 },
        { x: 250, y: 68 },
      ],
    });
  });
  it("maps adjacent plates through boundaries without resetting", () => {
    expect(motifX(0, 250)).toBe(25);
    expect(motifX(250, 250)).toBe(275);
    expect(motifX(299)).toBe(299);
    expect(motifX(300)).toBe(300);
    expect(motifX(301)).toBe(299);
    expect(motifX(599)).toBe(1);
    expect(motifX(600)).toBe(0);
    expect(motifX(601)).toBe(1);
    expect(motifX(900)).toBe(300);
    expect(segments(400)).toEqual([
      { x: 0, mirrored: false },
      { x: 300, mirrored: true },
    ]);
  });
  it("covers and center crops proportionally", () => {
    expect(cover(600, 200, 128)).toEqual({
      width: 384,
      height: 128,
      x: -42,
      y: 0,
    });
    expect(segments(299)).toHaveLength(1);
    expect(segments(300)).toHaveLength(1);
    expect(segments(300.01)).toHaveLength(2);
    expect(segments(3000)).toHaveLength(10);
  });
});
