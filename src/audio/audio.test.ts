import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioEngine, GESTURE_EVENTS } from "./engine";
import { DEFAULT_AUDIO, parseAudioSettings } from "./settings";
import { RECIPES, SOUND_NAMES } from "./sounds";

function fakeContext() {
  const gains: { gain: { value: number; setValueAtTime(v: number): void; linearRampToValueAtTime(v: number): void } }[] = [];
  const stats = { oscillators: 0, suspended: 0, resumed: 0, gains };
  const context = {
    currentTime: 0,
    state: "running",
    destination: {},
    createOscillator() {
      stats.oscillators++;
      return {
        type: "square",
        frequency: { value: 0 },
        connect: () => undefined,
        start: () => undefined,
        stop: () => undefined,
      };
    },
    createGain() {
      const node = {
        gain: { value: 1, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined },
        connect: () => undefined,
      };
      gains.push(node);
      return node;
    },
    suspend: async () => void stats.suspended++,
    resume: async () => void stats.resumed++,
  };
  return { context: context as unknown as AudioContext, stats };
}

describe("recetas", () => {
  it("cada sonido tiene al menos una nota válida", () => {
    for (const name of SOUND_NAMES) {
      expect(RECIPES[name].length).toBeGreaterThan(0);
      for (const note of RECIPES[name]) {
        expect(note.freq).toBeGreaterThan(0);
        expect(note.dur).toBeGreaterThan(0);
        expect(note.gain).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe("motor de audio", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const silentMusic = { ...DEFAULT_AUDIO, music: 0 };

  it("reproduce un efecto después de habilitar el audio", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, silentMusic);
    engine.unlock();
    engine.play("reveal");
    expect(stats.oscillators).toBe(RECIPES.reveal.length);
  });

  it("no suena antes del primer gesto del usuario", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, silentMusic);
    engine.play("reveal");
    expect(stats.oscillators).toBe(0);
  });

  it("no crea osciladores en silencio ni con efectos en cero", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, { ...silentMusic, muted: true });
    engine.unlock();
    engine.play("win");
    engine.setSettings({ ...silentMusic, sfx: 0 });
    engine.play("win");
    expect(stats.oscillators).toBe(0);
  });

  it("avisa solo los sonidos que realmente se reproducen", () => {
    const { context } = fakeContext();
    const played: string[] = [];
    const engine = createAudioEngine(() => context, { ...silentMusic, muted: true }, (name) => played.push(name));
    engine.unlock();
    engine.play("hit");
    engine.setSettings(silentMusic);
    engine.play("flag");
    expect(played).toEqual(["flag"]);
  });

  it("sin audio disponible no lanza errores", () => {
    const engine = createAudioEngine(() => null, DEFAULT_AUDIO);
    engine.unlock();
    expect(() => engine.play("win")).not.toThrow();
    expect(() => engine.setHidden(true)).not.toThrow();
  });

  it("si crear el contexto falla, sigue sin sonido", () => {
    const engine = createAudioEngine(() => {
      throw new Error("no soportado");
    }, DEFAULT_AUDIO);
    expect(() => engine.unlock()).not.toThrow();
    expect(() => engine.play("win")).not.toThrow();
  });

  it("la música no arranca antes del gesto ni con volumen cero", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    vi.advanceTimersByTime(1000);
    expect(stats.oscillators).toBe(0);

    const quiet = fakeContext();
    const muted = createAudioEngine(() => quiet.context, silentMusic);
    muted.unlock();
    vi.advanceTimersByTime(1000);
    expect(quiet.stats.oscillators).toBe(0);
    engine.setHidden(true);
  });

  it("la música suena después del gesto y se pausa con la pestaña oculta", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    engine.unlock();
    vi.advanceTimersByTime(500);
    expect(stats.oscillators).toBeGreaterThan(0);
    engine.setHidden(true);
    expect(stats.suspended).toBe(1);
    const before = stats.oscillators;
    vi.advanceTimersByTime(5000);
    expect(stats.oscillators).toBe(before);
    (context as unknown as { currentTime: number }).currentTime = 10;
    engine.setHidden(false);
    expect(stats.resumed).toBeGreaterThan(0);
    vi.advanceTimersByTime(500);
    expect(stats.oscillators).toBeGreaterThan(before);
    engine.setSettings({ ...DEFAULT_AUDIO, muted: true });
  });

  it("silenciar detiene la música", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    engine.unlock();
    vi.advanceTimersByTime(500);
    engine.setSettings({ ...DEFAULT_AUDIO, muted: true });
    const before = stats.oscillators;
    vi.advanceTimersByTime(5000);
    expect(stats.oscillators).toBe(before);
  });
});

describe("motor de audio en casos reales", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const setClock = (context: AudioContext, seconds: number) => {
    (context as unknown as { currentTime: number }).currentTime = seconds;
  };

  it("cada gesto vuelve a intentar activar un audio suspendido", () => {
    const { context, stats } = fakeContext();
    (context as unknown as { state: string }).state = "suspended";
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    engine.unlock();
    engine.unlock();
    expect(stats.resumed).toBe(2);
    (context as unknown as { state: string }).state = "running";
    engine.unlock();
    expect(stats.resumed).toBe(2);
    engine.setSettings({ ...DEFAULT_AUDIO, muted: true });
  });

  it("escucha gestos que los navegadores aceptan en pantallas táctiles", () => {
    for (const event of ["pointerup", "touchend", "click", "keydown"]) expect(GESTURE_EVENTS).toContain(event);
  });

  it("silenciar y bajar la música afecta enseguida a lo ya programado", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    engine.unlock();
    const musicGain = stats.gains[0].gain;
    expect(musicGain.value).toBeCloseTo(0.4);
    engine.setSettings({ ...DEFAULT_AUDIO, music: 0.1 });
    expect(musicGain.value).toBeCloseTo(0.1);
    engine.setSettings({ ...DEFAULT_AUDIO, muted: true });
    expect(musicGain.value).toBe(0);
  });

  it("después de una pausa larga no acumula notas de golpe", () => {
    const { context, stats } = fakeContext();
    const engine = createAudioEngine(() => context, DEFAULT_AUDIO);
    engine.unlock();
    const before = stats.oscillators;
    setClock(context, 60);
    vi.advanceTimersByTime(100);
    expect(stats.oscillators - before).toBeLessThan(10);
    engine.setSettings({ ...DEFAULT_AUDIO, muted: true });
  });
});

describe("preferencias de audio", () => {
  it("usa los valores iniciales sin datos o con datos dañados", () => {
    expect(DEFAULT_AUDIO).toEqual({ sfx: 0.7, music: 0.4, muted: false });
    for (const raw of [null, "{roto", "null", "[]", '"x"']) expect(parseAudioSettings(raw)).toEqual(DEFAULT_AUDIO);
  });

  it("recorta los valores entre 0 y 1", () => {
    expect(parseAudioSettings('{"sfx":5,"music":-1,"muted":true}')).toEqual({ sfx: 1, music: 0, muted: true });
  });

  it("reemplaza campos faltantes o inválidos", () => {
    expect(parseAudioSettings('{"sfx":"mucho"}')).toEqual(DEFAULT_AUDIO);
  });
});
