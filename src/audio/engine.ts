import type { AudioSettings } from "./settings";
import { MUSIC_BASS, MUSIC_MELODY, MUSIC_STEP_SECONDS, RECIPES, type Note, type SoundName } from "./sounds";

const SCHEDULE_EVERY_MS = 100;
const SCHEDULE_AHEAD_SECONDS = 0.4;
const ATTACK_SECONDS = 0.005;
const RESTART_DELAY_SECONDS = 0.05;

const MELODY_NOTE = { type: "triangle" as OscillatorType, gain: 0.16, dur: MUSIC_STEP_SECONDS * 1.6 };
const BASS_NOTE = { type: "triangle" as OscillatorType, gain: 0.18, dur: MUSIC_STEP_SECONDS * 3 };

/** Eventos que los navegadores, también en táctil, aceptan como gesto para activar el audio. */
export const GESTURE_EVENTS = ["pointerdown", "pointerup", "touchend", "click", "keydown"];

export interface AudioEngine {
  play(name: SoundName): void;
  unlock(): void;
  getSettings(): AudioSettings;
  setSettings(settings: AudioSettings): void;
  setHidden(hidden: boolean): void;
}

export function createAudioEngine(
  createContext: () => AudioContext | null,
  initial: AudioSettings,
  onPlay: (name: SoundName) => void = () => undefined,
): AudioEngine {
  let settings = initial;
  let context: AudioContext | null = null;
  let musicGain: GainNode | null = null;
  let contextRequested = false;
  let hidden = false;
  let timer: ReturnType<typeof setInterval> | null = null;
  let step = 0;
  let nextStepAt = 0;

  const scheduleNote = (ctx: AudioContext, note: Note, startAt: number, volume: number, output: AudioNode) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    const peak = note.gain * volume;
    const end = startAt + note.dur;
    oscillator.type = note.type;
    oscillator.frequency.value = note.freq;
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(peak, startAt + ATTACK_SECONDS);
    gain.gain.linearRampToValueAtTime(0, end);
    oscillator.connect(gain);
    gain.connect(output);
    oscillator.start(startAt);
    oscillator.stop(end);
  };

  const scheduleMusic = () => {
    if (!context || !musicGain) return;
    // Después de una pausa larga sigue desde ahora, sin tocar de golpe lo atrasado.
    if (nextStepAt < context.currentTime) nextStepAt = context.currentTime + RESTART_DELAY_SECONDS;
    while (nextStepAt < context.currentTime + SCHEDULE_AHEAD_SECONDS) {
      const index = step % MUSIC_MELODY.length;
      const melody = MUSIC_MELODY[index];
      const bass = MUSIC_BASS[index];
      if (melody !== null) scheduleNote(context, { ...MELODY_NOTE, freq: melody, at: 0 }, nextStepAt, 1, musicGain);
      if (bass !== null) scheduleNote(context, { ...BASS_NOTE, freq: bass, at: 0 }, nextStepAt, 1, musicGain);
      step++;
      nextStepAt += MUSIC_STEP_SECONDS;
    }
  };

  const syncMusic = () => {
    // El control general hace que silenciar y mover el volumen afecten también a lo ya programado.
    if (musicGain) musicGain.gain.value = settings.muted ? 0 : settings.music;
    const shouldPlay = Boolean(context) && !hidden && !settings.muted && settings.music > 0;
    if (shouldPlay && timer === null) {
      scheduleMusic();
      timer = setInterval(scheduleMusic, SCHEDULE_EVERY_MS);
    } else if (!shouldPlay && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };

  return {
    unlock() {
      if (!contextRequested) {
        contextRequested = true;
        try {
          context = createContext();
          if (context) {
            musicGain = context.createGain();
            musicGain.connect(context.destination);
          }
        } catch {
          context = null;
        }
        syncMusic();
      }
      // Un gesto puede no alcanzar para activar el audio, así que cada uno vuelve a intentarlo.
      if (context?.state === "suspended" && !hidden) void context.resume();
    },
    play(name) {
      if (!context || settings.muted || settings.sfx <= 0) return;
      const startAt = context.currentTime;
      for (const note of RECIPES[name]) scheduleNote(context, note, startAt + note.at, settings.sfx, context.destination);
      onPlay(name);
    },
    getSettings: () => settings,
    setSettings(next) {
      settings = next;
      syncMusic();
    },
    setHidden(value) {
      hidden = value;
      if (context) void (value ? context.suspend() : context.resume());
      syncMusic();
    },
  };
}
