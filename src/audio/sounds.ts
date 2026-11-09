// Recetas de sonido en estilo chiptune. Para ajustar cómo suena el juego, se cambia este archivo.

export type SoundName = "reveal" | "cascade" | "flag" | "unflag" | "hit" | "win" | "power" | "buy" | "rescue";

export interface Note {
  /** Frecuencia en Hz. */
  freq: number;
  /** Comienzo, en segundos desde el inicio del sonido. */
  at: number;
  /** Duración en segundos. */
  dur: number;
  type: OscillatorType;
  /** Volumen de la nota, de 0 a 1, antes del ajuste del jugador. */
  gain: number;
}

const note = (freq: number, at: number, dur: number, type: OscillatorType = "square", gain = 0.2): Note => ({
  freq,
  at,
  dur,
  type,
  gain,
});

export const SOUND_NAMES: SoundName[] = ["reveal", "cascade", "flag", "unflag", "hit", "win", "power", "buy", "rescue"];

export const RECIPES: Record<SoundName, Note[]> = {
  reveal: [note(660, 0, 0.05, "square", 0.12)],
  cascade: [note(523, 0, 0.05, "square", 0.12), note(659, 0.04, 0.05, "square", 0.12), note(784, 0.08, 0.07, "square", 0.12)],
  flag: [note(880, 0, 0.04, "triangle", 0.25), note(1175, 0.04, 0.06, "triangle", 0.25)],
  unflag: [note(880, 0, 0.04, "triangle", 0.2), note(622, 0.04, 0.06, "triangle", 0.2)],
  hit: [
    note(392, 0, 0.1, "sawtooth", 0.25),
    note(311, 0.09, 0.12, "sawtooth", 0.25),
    note(233, 0.2, 0.22, "sawtooth", 0.25),
  ],
  win: [
    note(523, 0, 0.1),
    note(659, 0.1, 0.1),
    note(784, 0.2, 0.1),
    note(1047, 0.3, 0.28),
    note(523, 0.3, 0.28, "triangle", 0.25),
  ],
  power: [note(494, 0, 0.06, "triangle", 0.28), note(740, 0.05, 0.06, "triangle", 0.28), note(988, 0.1, 0.12, "triangle", 0.28)],
  buy: [note(988, 0, 0.06), note(1319, 0.06, 0.14)],
  rescue: [
    note(659, 0, 0.09),
    note(880, 0.09, 0.09),
    note(1109, 0.18, 0.09),
    note(1319, 0.27, 0.3),
    note(880, 0.27, 0.3, "triangle", 0.25),
  ],
};

/** Música: una frase tranquila en La mayor pentatónica. Cada paso dura lo mismo. */
export const MUSIC_STEP_SECONDS = 0.3;

const A3 = 220;
const CS4 = 277.18;
const E4 = 329.63;
const FS4 = 369.99;
const A4 = 440;
const B4 = 493.88;
const CS5 = 554.37;
const E5 = 659.25;
const A2 = 110;
const D3 = 146.83;
const E3 = 164.81;
const FS3 = 185;

// null es un silencio.
export const MUSIC_MELODY: (number | null)[] = [
  E4, null, A4, null, CS5, null, B4, A4,
  FS4, null, A4, null, E4, null, null, null,
  E4, null, A4, null, CS5, null, E5, CS5,
  B4, null, A4, null, B4, null, null, null,
  CS5, null, B4, A4, FS4, null, E4, null,
  A3, null, CS4, null, E4, null, FS4, null,
  A4, null, CS5, null, B4, null, A4, FS4,
  E4, null, CS4, null, A3, null, null, null,
];

export const MUSIC_BASS: (number | null)[] = [
  A2, null, null, null, E3, null, null, null,
  FS3, null, null, null, D3, null, null, null,
  A2, null, null, null, E3, null, null, null,
  D3, null, null, null, E3, null, null, null,
  A2, null, null, null, FS3, null, null, null,
  D3, null, null, null, A2, null, null, null,
  D3, null, null, null, E3, null, null, null,
  A2, null, E3, null, A2, null, null, null,
];
