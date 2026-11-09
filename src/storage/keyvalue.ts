export interface KeyValue {
  get(k: string): Promise<string | null>;
  set(k: string, v: string): Promise<void>;
}

export function memoryKeyValue(): KeyValue {
  const values = new Map<string, string>();
  return {
    get: async (k) => values.get(k) ?? null,
    set: async (k, v) => {
      values.set(k, v);
    },
  };
}

export function deviceKeyValue(): KeyValue {
  return {
    async get(k) {
      try {
        return localStorage.getItem(k);
      } catch {
        return null;
      }
    },
    async set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch {
        // Sin almacenamiento disponible, el juego sigue en memoria.
      }
    },
  };
}
