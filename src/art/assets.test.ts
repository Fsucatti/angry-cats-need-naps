import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { CATS } from "../economy/cats";

const POSES = ["sit", "sleep"];
const ICONS = ["lata", "huella", "enojado"];

async function cornersAreTransparent(path: string): Promise<boolean> {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const alphaAt = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
  const { width: w, height: h } = info;
  return alphaAt(0, 0) === 0 && alphaAt(w - 1, 0) === 0 && alphaAt(0, h - 1) === 0 && alphaAt(w - 1, h - 1) === 0;
}

describe("sprites de gatos", () => {
  for (const cat of CATS) {
    for (const pose of POSES) {
      it(`${cat.id} ${pose} existe y tiene fondo transparente`, async () => {
        const path = `public/art/cats/${cat.id}-${pose}.png`;
        expect(existsSync(path)).toBe(true);
        expect(await cornersAreTransparent(path)).toBe(true);
      });
    }
  }
});

describe("íconos", () => {
  for (const icon of ICONS) {
    it(`${icon} existe y tiene fondo transparente`, async () => {
      const path = `public/art/icons/${icon}.png`;
      expect(existsSync(path)).toBe(true);
      expect(await cornersAreTransparent(path)).toBe(true);
    });
  }
});

describe("salas", () => {
  for (const room of ["entrada", "patio", "dormitorio"]) {
    for (const level of [0, 1, 2, 3]) {
      it(`${room} nivel ${level} existe y tiene la misma proporción`, async () => {
        const path = `public/art/rooms/${room}-${level}.png`;
        expect(existsSync(path)).toBe(true);
        const { width, height } = await sharp(path).metadata();
        expect(width / height).toBeCloseTo(2, 1);
      });
    }
  }

  it("todo el arte pesa menos de 3 MB", () => {
    const total = (dir: string): number =>
      readdirSync(dir, { withFileTypes: true }).reduce(
        (sum, entry) => sum + (entry.isDirectory() ? total(join(dir, entry.name)) : statSync(join(dir, entry.name)).size),
        0,
      );
    expect(total("public/art")).toBeLessThan(3 * 1024 * 1024);
  });
});
