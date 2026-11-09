import { describe, expect, it } from "vitest";
import { finishTutorial, newPlayer } from "../economy/player";
import { memoryKeyValue } from "./keyvalue";
import { BACKUP_KEY, loadProgress, MAIN_KEY, saveProgress } from "./progress";

const played = finishTutorial(newPlayer());

describe("guardado", () => {
  it("empieza de cero, sin aviso, si nunca se guardó", async () => {
    expect(await loadProgress(memoryKeyValue())).toEqual({ player: newPlayer(), status: "ok" });
  });

  it("recupera lo guardado", async () => {
    const kv = memoryKeyValue();
    await saveProgress(kv, played);
    expect(await loadProgress(kv)).toEqual({ player: played, status: "ok" });
  });

  it("usa el respaldo si el principal está dañado", async () => {
    const kv = memoryKeyValue();
    await saveProgress(kv, played);
    await kv.set(MAIN_KEY, "{roto");
    expect(await loadProgress(kv)).toEqual({ player: played, status: "restored" });
  });

  it("reinicia si ambos están dañados", async () => {
    const kv = memoryKeyValue();
    await kv.set(MAIN_KEY, "{roto");
    await kv.set(BACKUP_KEY, "tampoco");
    expect(await loadProgress(kv)).toEqual({ player: newPlayer(), status: "reset" });
  });

  it("usa el respaldo si el principal tiene las salas en null", async () => {
    const kv = memoryKeyValue();
    await saveProgress(kv, played);
    await kv.set(MAIN_KEY, JSON.stringify({ ...played, rooms: null }));
    expect(await loadProgress(kv)).toEqual({ player: played, status: "restored" });
  });

  it("si leer falla, empieza de cero sin lanzar un error", async () => {
    const failing = { get: () => Promise.reject(new Error("bloqueado")), set: () => Promise.resolve() };
    expect(await loadProgress(failing)).toEqual({ player: newPlayer(), status: "reset" });
  });

  it("rechaza JSON válido con forma incorrecta o versión desconocida", async () => {
    for (const bad of ['{"latas":"muchas"}', '{"version":99}', "null", "[]"]) {
      const kv = memoryKeyValue();
      await kv.set(MAIN_KEY, bad);
      expect((await loadProgress(kv)).status).toBe("reset");
    }
  });
});
