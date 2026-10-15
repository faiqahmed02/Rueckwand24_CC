import { Tools } from "./Tools";
import { restorePreferences } from "./units";
import { usePlateMotion, reducedMotion } from "./motion";
import type { PreviewHandle } from "./Preview";
import { restore, persist } from "./persistence";
import { useEffect, useReducer, useState, useRef } from "react";
import { type Axis, reducer, makePlate } from "./model";
import { Dimension } from "./Dimension";
import { Preview } from "./Preview";
import styles from "./App.module.css";
export function App() {
  const [plates, dispatch] = useReducer(reducer, undefined, restore);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, { id: string; message: string } | null>
  >({});
  const [preferences, setPreferences] = useState(restorePreferences);
  const [motif, setMotif] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [exportError, setExportError] = useState("");
  const [reordering, setReordering] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const previewRef = useRef<PreviewHandle>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nodes = usePlateMotion(plates);
  useEffect(
    () => () => {
      if (removeTimer.current) clearTimeout(removeTimer.current);
    },
    [],
  );
  useEffect(
    () => () => {
      if (motif) URL.revokeObjectURL(motif);
    },
    [motif],
  );
  useEffect(() => {
    try {
      localStorage.setItem("r24-preferences", JSON.stringify(preferences));
    } catch {
      /* Plate save status is handled separately. */
    }
  }, [preferences]);
  function move(id: string, to: number) {
    dispatch({ type: "move", id, to });
    setAnnouncement(`Rückwand auf Position ${to + 1} verschoben.`);
  }
  function remove(id: string) {
    if (leaving || plates.length === 1) return;
    setLeaving(id);
    removeTimer.current = setTimeout(
      () => {
        dispatch({ type: "remove", id });
        setActiveId((current) => (current === id ? null : current));
        setValidationErrors((current) => {
          const next = { ...current };
          delete next[id];
          return next;
        });
        setLeaving(null);
      },
      reducedMotion() ? 0 : 160,
    );
  }
  const [saved, setSaved] = useState(true);
  useEffect(() => setSaved(persist(plates)), [plates]);
  return (
    <main className={styles.app}>
      <div className={styles.workspace}>
        <Preview
          ref={previewRef}
          plates={plates}
          activeId={activeId}
          motif={motif}
          onReady={setReady}
        />
        <section
          className={styles.controls}
          aria-label="Rückwände konfigurieren"
        >
          <h1 className={styles.title}>
            <strong>Maße.</strong> Eingeben.
          </h1>
          <div className={styles.plateList}>
            {plates.map((plate, i) => {
              const expanded = activeId === plate.id;
              return (
                <div className={styles.plateGroup} key={plate.id}>
                  {validationErrors[plate.id] && (
                    <div
                      className={styles.validationBanner}
                      id={validationErrors[plate.id]!.id}
                      role="alert"
                    >
                      <span className={styles.infoIcon} aria-hidden="true">
                        i
                      </span>
                      <span>{validationErrors[plate.id]!.message}</span>
                    </div>
                  )}
                  <article
                    className={`${styles.plate} ${expanded ? styles.expanded : ""} ${leaving === plate.id ? styles.leaving : ""} ${dragId === plate.id ? styles.dragging : ""} ${reordering ? styles.sortable : ""} `}
                    key={plate.id}
                    ref={(node) => {
                      if (node) nodes.current.set(plate.id, node);
                      else nodes.current.delete(plate.id);
                    }}
                    onDragOver={(event) => {
                      if (reordering && dragId) {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = "move";
                      }
                    }}
                    onDrop={(event) => {
                      if (reordering && dragId) {
                        event.preventDefault();
                        move(dragId, i);
                        setDragId(null);
                      }
                    }}
                    aria-label={`Rückwand ${i + 1}`}
                    onFocus={(event) => {
                      if (event.target instanceof HTMLInputElement)
                        setActiveId(plate.id);
                    }}
                  >
                    <button
                      className={styles.number}
                      aria-label={`Rückwand ${i + 1} bearbeiten`}
                      aria-expanded={expanded}
                      onClick={() =>
                        document.getElementById(`${plate.id}-width`)?.focus()
                      }
                    >
                      {i + 1}
                    </button>
                    {reordering && (
                      <div className={styles.reorder}>
                        <button
                          className={styles.dragHandle}
                          draggable
                          aria-label={`Rückwand ${i + 1} ziehen`}
                          onDragStart={(event) => {
                            setDragId(plate.id);
                            event.dataTransfer.setData("text/plain", plate.id);
                            event.dataTransfer.effectAllowed = "move";
                          }}
                          onDragEnd={() => setDragId(null)}
                          onKeyDown={(event) => {
                            if (
                              event.key === "ArrowUp" ||
                              event.key === "ArrowDown"
                            ) {
                              event.preventDefault();
                              const to = i + (event.key === "ArrowUp" ? -1 : 1);
                              if (to >= 0 && to < plates.length)
                                move(plate.id, to);
                            }
                          }}
                        >
                          <svg
                            width="14"
                            height="18"
                            viewBox="0 0 14 18"
                            aria-hidden="true"
                          >
                            {[4, 9, 14].flatMap((y) =>
                              [4, 10].map((x) => (
                                <circle
                                  key={`${x}-${y}`}
                                  cx={x}
                                  cy={y}
                                  r="1.3"
                                  fill="currentColor"
                                />
                              )),
                            )}
                          </svg>
                          <span>Ziehen</span>
                        </button>
                        <button
                          aria-label={`Rückwand ${i + 1} nach oben`}
                          disabled={i === 0}
                          onClick={() => move(plate.id, i - 1)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m6 10 6-6 6 6M12 4v16" />
                          </svg>
                        </button>
                        <button
                          aria-label={`Rückwand ${i + 1} nach unten`}
                          disabled={i === plates.length - 1}
                          onClick={() => move(plate.id, i + 1)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="m6 14 6 6 6-6M12 20V4" />
                          </svg>
                        </button>
                      </div>
                    )}
                    <div className={styles.fields}>
                      {(["width", "height"] as Axis[]).map((axis) => (
                        <Dimension
                          key={`${axis}-${preferences.unit}-${preferences.locale}`}
                          unit={preferences.unit}
                          locale={preferences.locale}
                          plate={plate}
                          axis={axis}
                          expanded={expanded}
                          onValidation={(error) =>
                            setValidationErrors((current) => ({
                              ...current,
                              [plate.id]: error,
                            }))
                          }
                          onChange={(value) =>
                            dispatch({
                              type: "resize",
                              id: plate.id,
                              axis,
                              value,
                            })
                          }
                        />
                      ))}
                    </div>
                    <button
                      className={styles.remove}
                      disabled={plates.length === 1 || leaving !== null}
                      aria-label={`Rückwand ${i + 1} entfernen`}
                      onClick={() => remove(plate.id)}
                    >
                      −
                    </button>
                  </article>
                </div>
              );
            })}
          </div>
          <button
            className={styles.add}
            disabled={plates.length === 10}
            aria-describedby="plate-limit"
            onClick={() => {
              const plate = makePlate();
              dispatch({ type: "add", plate });
              setActiveId(plate.id);
            }}
          >
            Rückwand hinzufügen <span aria-hidden="true">＋</span>
          </button>
          <p
            id="plate-limit"
            className={plates.length === 10 ? styles.hint : styles.srOnly}
          >
            {plates.length === 10
              ? "Maximal 10 Rückwände erreicht."
              : "Bis zu 10 Rückwände · Maße in Zentimetern"}
          </p>
          <Tools
            unit={preferences.unit}
            locale={preferences.locale}
            onUnit={(unit) => setPreferences((p) => ({ ...p, unit }))}
            onLocale={(locale) => setPreferences((p) => ({ ...p, locale }))}
            onMotif={(url) => {
              setMotif(url);
              setExportError("");
            }}
            ready={ready}
            reordering={reordering}
            onReordering={() => setReordering((value) => !value)}
            onExport={() => {
              setExportError("");
              void previewRef.current
                ?.exportPng()
                .catch(() =>
                  setExportError(
                    "PNG-Export nicht möglich. Bei externen Motiven muss der Bildserver CORS erlauben.",
                  ),
                );
            }}
          />
          {exportError && (
            <p role="alert" className={styles.error}>
              {exportError}
            </p>
          )}
          <span className={styles.srOnly} aria-live="polite">
            {announcement}
          </span>
          {!saved && (
            <p className={styles.storage} role="status">
              Speichern nicht verfügbar. Deine Änderungen bleiben bis zum
              Neuladen erhalten.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
