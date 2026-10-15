import { reducedMotion } from "./motion";
import { render } from "./renderer";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import type { Plate } from "./model";
import { layout } from "./geometry";
import styles from "./App.module.css";
export type PreviewHandle = { exportPng: () => Promise<void> };
export const Preview = forwardRef<
  PreviewHandle,
  {
    plates: Plate[];
    activeId?: string | null;
    motif?: string | null;
    onReady?: (ready: boolean) => void;
  }
>(function Preview({ plates, activeId, motif, onReady }, ref) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 600, h: 350 });
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [status, setStatus] = useState("loading");
  useImperativeHandle(
    ref,
    () => ({
      async exportPng() {
        if (!img || status !== "ready") throw Error("Image unavailable");
        const g = layout(plates);
        const output = document.createElement("canvas");
        output.width = Math.round(g.width * 2);
        output.height = Math.round(g.height * 2);
        const ctx = output.getContext("2d");
        if (!ctx) throw Error("Canvas unavailable");
        render(ctx, img, plates, g.width, g.height, 2);
        const blob = await new Promise<Blob>((resolve, reject) => {
          try {
            output.toBlob(
              (value) =>
                value ? resolve(value) : reject(Error("Export failed")),
              "image/png",
            );
          } catch (error) {
            reject(error);
          }
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "rueckwand24-vorschau.png";
        link.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
    }),
    [img, status, plates],
  );
  useEffect(() => {
    onReady?.(status === "ready");
  }, [status, onReady]);
  useEffect(() => {
    setStatus("loading");
    setImg(null);
    const image = new Image();
    image.crossOrigin = "anonymous";
    let active = true;
    image.onload = () => {
      if (active) {
        setImg(image);
        setStatus("ready");
      }
    };
    image.onerror = () => active && setStatus("error");
    image.src = motif || import.meta.env.VITE_MOTIF_URL || "/motif.jpg";
    return () => {
      active = false;
    };
  }, [motif]);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setSize({ w: entry.contentRect.width, h: entry.contentRect.height }),
    );
    if (box.current) observer.observe(box.current);
    return () => observer.disconnect();
  }, []);
  const shown = useRef<Plate[]>(plates);
  useEffect(() => {
    if (!canvas.current || !img || size.w <= 0 || size.h <= 0) return;
    const element = canvas.current;
    const dpr = window.devicePixelRatio || 1;
    element.width = Math.round(size.w * dpr);
    element.height = Math.round(size.h * dpr);
    const ctx = element.getContext("2d");
    if (!ctx) return;
    const start = performance.now();
    const from = shown.current;
    const resizing = plates.some((p) => {
      const old = from.find((value) => value.id === p.id);
      return old && (old.width !== p.width || old.height !== p.height);
    });
    let frame = 0;
    const animate = (now: number) => {
      const progress =
        !resizing || reducedMotion() ? 1 : Math.min(1, (now - start) / 160);
      const t = 1 - (1 - progress) ** 3;
      const current = plates.map((p) => {
        const before = from.find((old) => old.id === p.id) ?? p;
        return {
          ...p,
          width: before.width + (p.width - before.width) * t,
          height: before.height + (p.height - before.height) * t,
        };
      });
      shown.current = current;
      render(ctx, img, current, size.w, size.h, dpr, activeId);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [plates, size, img, activeId]);
  const g = layout(plates);
  return (
    <section className={styles.preview} aria-label="Vorschau">
      <div ref={box} className={styles.canvasBox}>
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Motiv auf ${plates.length} Rückwänden, ${g.width} cm breit`}
        />
        {status !== "ready" && (
          <p role="status">
            {status === "error"
              ? "Das Motiv konnte nicht geladen werden. Maße können weiterhin bearbeitet werden."
              : "Motiv wird geladen …"}
          </p>
        )}
      </div>
    </section>
  );
});
