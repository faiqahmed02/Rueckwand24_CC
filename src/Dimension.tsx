import {
  formatDimension,
  parseUnitDimension,
  unitRange,
  type Unit,
  type Locale,
} from "./units";
import { useState } from "react";
import { type Plate, type Axis } from "./model";
import styles from "./App.module.css";
export function Dimension({
  plate,
  axis,
  onChange,
  onValidation,
  expanded = true,
  unit = "cm",
  locale = "de-DE",
}: {
  plate: Plate;
  axis: Axis;
  onChange: (n: number) => void;
  onValidation?: (error: { id: string; message: string } | null) => void;
  expanded?: boolean;
  unit?: Unit;
  locale?: Locale;
}) {
  const [raw, setRaw] = useState(formatDimension(plate[axis], unit, locale));
  const valid = parseUnitDimension(raw, axis, unit);
  const id = `${plate.id}-${axis}`;
  const message = `Die ${axis === "width" ? "Breite" : "Höhe"} muss zwischen ${unitRange(axis, unit, locale).replace(" – ", " und ")} ${unit} liegen (max. ${unit === "cm" ? 2 : 4} Dezimalstellen).`;
  return (
    <div className={`${styles.field} ${!expanded ? styles.compact : ""}`}>
      <label className={styles.fieldHeading} htmlFor={id}>
        <span>{axis === "width" ? "Breite" : "Höhe"}</span>
        <small>
          {unitRange(axis, unit, locale)} {unit}
        </small>
      </label>
      <div
        className={`${styles.inputWrap} ${valid === null ? styles.invalid : ""}`}
      >
        <input
          id={id}
          aria-label={axis === "width" ? "Breite" : "Höhe"}
          inputMode="decimal"
          type="text"
          value={raw}
          aria-invalid={valid === null}
          aria-describedby={valid === null ? `${id}-error` : undefined}
          onChange={(e) => {
            setRaw(e.target.value);
            const n = parseUnitDimension(e.target.value, axis, unit);
            onValidation?.(n === null ? { id: `${id}-error`, message } : null);
            if (n !== null) onChange(n);
          }}
          onBlur={() => {
            setRaw(formatDimension(plate[axis], unit, locale));
            onValidation?.(null);
          }}
        />
        <span aria-hidden="true">{unit}</span>
      </div>
      <span className={styles.millimeters}>
        {(plate[axis] * 10).toLocaleString(locale, {
          maximumFractionDigits: 2,
          useGrouping: false,
        })}{" "}
        mm
      </span>
      {valid === null && !onValidation && (
        <small className={styles.error} id={`${id}-error`} role="alert">
          {message}
        </small>
      )}
    </div>
  );
}
