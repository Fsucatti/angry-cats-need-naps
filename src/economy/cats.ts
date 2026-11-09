import type { Power } from "../engine/powers";

export interface Cat {
  id: string;
  name: string;
  power: Power;
}

export const CATS: Cat[] = [
  { id: "hana", name: "Hana", power: { id: "olfato", level: 1 } },
  { id: "luca", name: "Luca", power: { id: "vigia", level: 1 } },
  { id: "freya", name: "Freya", power: { id: "sieteVidas", level: 1 } },
  { id: "sasha", name: "Sasha", power: { id: "oidoFino", level: 1 } },
  { id: "noor", name: "Noor", power: { id: "barrido", level: 1 } },
  { id: "anouk", name: "Anouk", power: { id: "olfato", level: 2 } },
  { id: "emre", name: "Emre", power: { id: "vigia", level: 2 } },
  { id: "ilse", name: "Ilse", power: { id: "oidoFino", level: 2 } },
  { id: "kai", name: "Kai", power: { id: "barrido", level: 2 } },
  { id: "aroha", name: "Aroha", power: { id: "sieteVidas", level: 2 } },
];
