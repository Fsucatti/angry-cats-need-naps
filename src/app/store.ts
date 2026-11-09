import { create } from "zustand";
import { newPlayer, type Player } from "../economy/player";
import { detectLanguage, setLanguage } from "../i18n";
import { deviceKeyValue } from "../storage/keyvalue";
import { loadProgress, saveProgress } from "../storage/progress";

interface PlayerStore {
  player: Player;
  ready: boolean;
  loadNotice: "restored" | "reset" | null;
  update(fn: (p: Player) => Player): void;
  init(): Promise<void>;
}

const kv = deviceKeyValue();

// Las escrituras van en fila, para que una vieja nunca pise a una nueva.
let writes: Promise<unknown> = Promise.resolve();

export const usePlayer = create<PlayerStore>((set, get) => ({
  player: newPlayer(),
  ready: false,
  loadNotice: null,
  update(fn) {
    const before = get().player;
    const after = fn(before);
    if (after === before) return;
    set({ player: after });
    setLanguage(after.language ?? detectLanguage(navigator.language));
    writes = writes.then(() => saveProgress(kv, after)).catch(() => undefined);
  },
  async init() {
    const { player, status } = await loadProgress(kv);
    setLanguage(player.language ?? detectLanguage(navigator.language));
    set({ player, ready: true, loadNotice: status === "ok" ? null : status });
  },
}));
