import { describe, expect, it } from "vitest";
import { resolveWebDate } from "./webRoute";

describe("resolveWebDate", () => {
  const today = "2026-12-05";

  it("respeta una fecha pasada o la de hoy", () => {
    expect(resolveWebDate("2026-12-02", today)).toBe("2026-12-02");
    expect(resolveWebDate(today, today)).toBe(today);
  });

  it("lleva a hoy las fechas futuras, anteriores al primer tablero o inválidas", () => {
    for (const date of ["2026-12-06", "2026-01-01", "hola", "2026-13-45", null]) {
      expect(resolveWebDate(date, today)).toBe(today);
    }
  });

  it("sin desafíos todavía, devuelve null", () => {
    expect(resolveWebDate(null, "2026-11-01")).toBeNull();
    expect(resolveWebDate("2026-12-02", "2026-11-01")).toBeNull();
  });
});
