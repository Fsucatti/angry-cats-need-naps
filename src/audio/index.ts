import { createAudioEngine, GESTURE_EVENTS } from "./engine";
import { loadAudioSettings } from "./settings";
import type { SoundName } from "./sounds";

declare global {
  interface Window {
    /** Solo en desarrollo: registro de sonidos para las pruebas. */
    __refugioSounds?: SoundName[];
  }
}

export const audio = createAudioEngine(
  () => (typeof AudioContext === "undefined" ? null : new AudioContext()),
  loadAudioSettings(),
  (name) => {
    if (import.meta.env.DEV) (window.__refugioSounds ??= []).push(name);
  },
);

/** El navegador solo permite sonar después de un gesto del usuario. */
export function connectAudioToPage(): void {
  const unlock = () => audio.unlock();
  for (const event of GESTURE_EVENTS) window.addEventListener(event, unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => audio.setHidden(document.hidden));
}
