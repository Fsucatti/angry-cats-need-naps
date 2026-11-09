import { describe, expect, it } from "vitest";
import en from "./en.json";
import es from "./es.json";
import { detectLanguage, setLanguage, t } from "./index";

describe("textos", () => {
  it("ambos idiomas tienen las mismas claves", () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it("reemplaza variables y cambia de idioma", () => {
    setLanguage("es");
    expect(t("latas.count", { n: 3 })).toBe("3 latas");
    setLanguage("en");
    expect(t("latas.count", { n: 3 })).toBe("3 cans");
  });

  it("detecta el idioma del dispositivo", () => {
    expect(detectLanguage("es-AR")).toBe("es");
    expect(detectLanguage("en-US")).toBe("en");
    expect(detectLanguage("de")).toBe("en");
  });
});
