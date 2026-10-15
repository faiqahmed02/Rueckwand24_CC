import { useLayoutEffect, useRef } from "react";
import type { Plate } from "./model";
export function reducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
export function usePlateMotion(plates: Plate[]) {
  const nodes = useRef(new Map<string, HTMLElement>());
  const previous = useRef(new Map<string, { top: number }>());
  useLayoutEffect(() => {
    const next = new Map<string, { top: number }>();
    const animations: Animation[] = [];
    for (const [id, node] of nodes.current) {
      const rect = { top: node.getBoundingClientRect().top + window.scrollY };
      next.set(id, rect);
      const old = previous.current.get(id);
      if (old && !reducedMotion() && Math.abs(old.top - rect.top) > 1)
        animations.push(
          node.animate(
            [
              { transform: `translateY(${old.top - rect.top}px)` },
              { transform: "translateY(0)" },
            ],
            { duration: 180, easing: "ease-out" },
          ),
        );
    }
    previous.current = next;
    return () => animations.forEach((animation) => animation.cancel());
  }, [plates]);
  return nodes;
}
