import { describe, expect, it } from "vitest";
import { CATS } from "./cats";
import {
  finishGame,
  finishTutorial,
  gameReward,
  isUnlocked,
  newPlayer,
  nextCatPrice,
  rescueNext,
  roomPrice,
  upgradeRoom,
} from "./player";

describe("recompensas", () => {
  it("aplica los valores de la especificación", () => {
    expect(gameReward("facil", true, 0)).toBe(25);
    expect(gameReward("media", true, 0)).toBe(44);
    expect(gameReward("dificil", true, 0)).toBe(75);
    expect(gameReward("media", true, 1)).toBe(35);
    expect(gameReward("media", false, 0)).toBe(5);
  });

  it("finishGame suma latas y cuenta victorias", () => {
    const { player, reward } = finishGame(newPlayer(), "facil", true, 0);
    expect(reward).toBe(25);
    expect(player.latas).toBe(25);
    expect(player.wins.facil).toBe(1);
    expect(finishGame(player, "facil", false, 0).player.wins.facil).toBe(1);
  });
});

describe("tutorial y desbloqueos", () => {
  it("el tutorial rescata a Hana y alcanza justo para la primera mejora", () => {
    const p = finishTutorial(newPlayer());
    expect(p.rescued).toBe(1);
    expect(p.latas).toBe(50);
    expect(p.tutorialDone).toBe(true);
    expect(CATS[0].name).toBe("Hana");
    const upgraded = upgradeRoom(p, "entrada");
    expect(upgraded.rooms.entrada).toBe(1);
    expect(upgraded.latas).toBe(0);
  });

  it("desbloquea cada dificultad en su límite exacto", () => {
    const base = newPlayer();
    expect(isUnlocked(base, "facil")).toBe(false);
    const done = finishTutorial(base);
    expect(isUnlocked(done, "facil")).toBe(true);
    expect(isUnlocked({ ...done, wins: { ...done.wins, facil: 2 } }, "media")).toBe(false);
    expect(isUnlocked({ ...done, wins: { ...done.wins, facil: 3 } }, "media")).toBe(true);
    expect(isUnlocked({ ...done, wins: { ...done.wins, media: 4 } }, "dificil")).toBe(false);
    expect(isUnlocked({ ...done, wins: { ...done.wins, media: 5 } }, "dificil")).toBe(true);
  });
});

describe("gatos", () => {
  it("son 10, en el orden y con los poderes de la especificación", () => {
    expect(CATS.map((c) => `${c.name}:${c.power.id}${c.power.level}`)).toEqual([
      "Hana:olfato1",
      "Luca:vigia1",
      "Freya:sieteVidas1",
      "Sasha:oidoFino1",
      "Noor:barrido1",
      "Anouk:olfato2",
      "Emre:vigia2",
      "Ilse:oidoFino2",
      "Kai:barrido2",
      "Aroha:sieteVidas2",
    ]);
  });

  it("cobra los precios en orden, del segundo al décimo gato", () => {
    let p = { ...finishTutorial(newPlayer()), latas: 10000 };
    const prices: (number | null)[] = [];
    for (let i = 0; i < 9; i++) {
      prices.push(nextCatPrice(p));
      p = rescueNext(p);
    }
    expect(prices).toEqual([40, 60, 80, 100, 130, 160, 200, 240, 290]);
    expect(p.rescued).toBe(10);
    expect(p.latas).toBe(10000 - 1300);
  });
});

describe("compras en sus límites", () => {
  it("con 39 latas no rescata", () => {
    const p = { ...finishTutorial(newPlayer()), latas: 39 };
    expect(rescueNext(p)).toBe(p);
  });

  it("dos rescates seguidos nunca dejan latas negativas", () => {
    const p = { ...finishTutorial(newPlayer()), latas: 70 };
    const once = rescueNext(p);
    expect(once.latas).toBe(30);
    expect(rescueNext(once)).toBe(once);
  });

  it("con 10 gatos no hay precio ni rescate", () => {
    const p = { ...newPlayer(), rescued: 10, latas: 9999 };
    expect(nextCatPrice(p)).toBeNull();
    expect(rescueNext(p)).toBe(p);
  });

  it("cobra las mejoras por nivel y frena en el máximo", () => {
    let p = { ...newPlayer(), latas: 1000 };
    const prices: (number | null)[] = [];
    for (let i = 0; i < 3; i++) {
      prices.push(roomPrice(p, "patio"));
      p = upgradeRoom(p, "patio");
    }
    expect(prices).toEqual([50, 100, 180]);
    expect(roomPrice(p, "patio")).toBeNull();
    expect(upgradeRoom(p, "patio")).toBe(p);
  });
});
