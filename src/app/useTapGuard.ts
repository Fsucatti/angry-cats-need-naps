import { useRef } from "react";

const GUARD_MS = 400;

/** Ignora el segundo toque de un doble toque en botones que gastan latas. */
export function useTapGuard(): (action: () => void) => void {
  const lastTap = useRef(0);
  return (action) => {
    const now = performance.now();
    if (now - lastTap.current < GUARD_MS) return;
    lastTap.current = now;
    action();
  };
}
