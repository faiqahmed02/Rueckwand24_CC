import { useEffect, useRef, useState } from "react";
import type { Unit, Locale } from "./units";
import styles from "./App.module.css";
type Props = {
  unit: Unit;
  locale: Locale;
  onUnit: (unit: Unit) => void;
  onLocale: (locale: Locale) => void;
  onMotif: (url: string | null) => void;
  onExport: () => void;
  ready: boolean;
  reordering: boolean;
  onReordering: () => void;
};
export function Tools({
  unit,
  locale,
  onUnit,
  onLocale,
  onMotif,
  onExport,
  ready,
  reordering,
  onReordering,
}: Props) {
  const [error, setError] = useState("");
  const [name, setName] = useState("Standardmotiv");
  const [loading, setLoading] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const request = useRef(0);
  const pendingUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      request.current++;
      if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    },
    [],
  );
  async function upload(file: File | undefined) {
    if (!file) return;
    const token = ++request.current;
    if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
    setError("");
    setLoading(false);
    if (
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size > 10 * 1024 * 1024
    ) {
      setError("Bitte JPG, PNG oder WebP mit maximal 10 MB auswählen.");
      return;
    }
    const url = URL.createObjectURL(file);
    pendingUrl.current = url;
    setLoading(true);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      if (token !== request.current) return;
      if (img.naturalWidth * img.naturalHeight > 40000000) throw Error();
      pendingUrl.current = null;
      onMotif(url);
      setName(file.name);
    } catch {
      if (token === request.current)
        setError(
          "Das Bild konnte nicht gelesen werden oder ist größer als 40 Megapixel.",
        );
      URL.revokeObjectURL(url);
      if (token === request.current) pendingUrl.current = null;
    } finally {
      if (token === request.current) setLoading(false);
    }
  }
  return (
    <details className={styles.tools}>
      <summary>Weitere Optionen</summary>
      <div className={styles.toolBody}>
        <div className={styles.toolRow}>
          <label>
            Einheit{" "}
            <select
              aria-label="Einheit"
              value={unit}
              onChange={(e) => onUnit(e.target.value as Unit)}
            >
              <option value="cm">Zentimeter (cm)</option>
              <option value="in">Inches (in)</option>
            </select>
          </label>
          <label>
            Zahlenformat{" "}
            <select
              aria-label="Zahlenformat"
              value={locale}
              onChange={(e) => onLocale(e.target.value as Locale)}
            >
              <option value="de-DE">Deutsch (1,5)</option>
              <option value="en-US">English (1.5)</option>
            </select>
          </label>
        </div>
        <input
          ref={input}
          className={styles.srOnly}
          tabIndex={-1}
          aria-label="Eigenes Motiv auswählen"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => {
            void upload(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        <div className={styles.toolActions}>
          <button onClick={() => input.current?.click()} disabled={loading}>
            {loading ? "Bild wird geprüft …" : "Motiv hochladen"}
          </button>
          <button
            onClick={() => {
              request.current++;
              if (pendingUrl.current) URL.revokeObjectURL(pendingUrl.current);
              pendingUrl.current = null;
              setLoading(false);
              onMotif(null);
              setName("Standardmotiv");
              setError("");
            }}
          >
            Standardmotiv
          </button>
          <button onClick={onExport} disabled={!ready}>
            PNG exportieren
          </button>
          <button
            className={styles.reorderToggle}
            aria-pressed={reordering}
            onClick={onReordering}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              {reordering ? (
                <path d="m5 12 4 4L19 6" />
              ) : (
                <path d="M8 20V4m-4 4 4-4 4 4m4-4v16m-4-4 4 4 4-4" />
              )}
            </svg>
            {reordering ? "Fertig" : "Reihenfolge ändern"}
          </button>
        </div>
        <p className={styles.toolNote}>
          {name} · Eigene Bilder bleiben nur bis zum Neuladen erhalten. JPG,
          PNG, WebP · max. 10 MB / 40 MP.
        </p>
        {reordering && (
          <p className={styles.toolNote}>
            Ziehen oder mit den Pfeilen verschieben. Mit „Fertig“ schließen. Am
            Griff funktionieren auch die Tasten ↑ und ↓.
          </p>
        )}
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
