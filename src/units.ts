import type { Axis } from "./model";
import { limits, parseDimension } from "./validation";
export type Unit = "cm" | "in";
export type Locale = "de-DE" | "en-US";
export function formatDimension(cm: number, unit: Unit, locale: Locale) {
  return new Intl.NumberFormat(locale, {
    useGrouping: false,
    maximumFractionDigits: unit === "cm" ? 2 : 4,
  }).format(unit === "cm" ? cm : cm / 2.54);
}
export function parseUnitDimension(
  raw: string,
  axis: Axis,
  unit: Unit,
): number | null {
  if (unit === "cm") return parseDimension(raw, axis);
  if (!/^\d+(?:[.,]\d{1,4})?$/.test(raw.trim())) return null;
  const cm =
    Math.round(Number(raw.trim().replace(",", ".")) * 2.54 * 100) / 100;
  return parseDimension(String(cm), axis);
}
export function unitRange(axis: Axis, unit: Unit, locale: Locale) {
  return limits[axis]
    .map((cm) => formatDimension(cm, unit, locale))
    .join(" – ");
}
export function restorePreferences(): { unit: Unit; locale: Locale } {
  try {
    const p = JSON.parse(localStorage.getItem("r24-preferences") ?? "null");
    return {
      unit: p?.unit === "in" ? "in" : "cm",
      locale: p?.locale === "en-US" ? "en-US" : "de-DE",
    };
  } catch {
    return { unit: "cm", locale: "de-DE" };
  }
}
