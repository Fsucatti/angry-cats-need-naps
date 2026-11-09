import en from "./en.json";
import es from "./es.json";

export type Language = "es" | "en";

const dictionaries: Record<Language, Record<string, string>> = { es, en };
let current: Language = "es";

export function setLanguage(lang: Language): void {
  current = lang;
  if (typeof document !== "undefined") document.documentElement.lang = lang;
}

export function getLanguage(): Language {
  return current;
}

export function detectLanguage(deviceLang: string): Language {
  return deviceLang.toLowerCase().startsWith("es") ? "es" : "en";
}

export function t(key: string, vars: Record<string, string | number> = {}): string {
  const template = dictionaries[current][key] ?? key;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => String(vars[name] ?? match));
}
