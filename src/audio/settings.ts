export interface AudioSettings {
  sfx: number;
  music: number;
  muted: boolean;
}

export const DEFAULT_AUDIO: AudioSettings = { sfx: 0.7, music: 0.4, muted: false };

const STORAGE_KEY = "refugio.audio";

const clamp = (value: number) => Math.min(1, Math.max(0, value));

export function parseAudioSettings(raw: string | null): AudioSettings {
  try {
    const parsed = JSON.parse(raw ?? "null") as Partial<AudioSettings> | null;
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      !Number.isFinite(parsed.sfx) ||
      !Number.isFinite(parsed.music) ||
      typeof parsed.muted !== "boolean"
    ) {
      return DEFAULT_AUDIO;
    }
    return { sfx: clamp(parsed.sfx!), music: clamp(parsed.music!), muted: parsed.muted };
  } catch {
    return DEFAULT_AUDIO;
  }
}

export function loadAudioSettings(): AudioSettings {
  try {
    return parseAudioSettings(localStorage.getItem(STORAGE_KEY));
  } catch {
    return DEFAULT_AUDIO;
  }
}

export function saveAudioSettings(settings: AudioSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Sin almacenamiento, el ajuste dura hasta cerrar la página.
  }
}
