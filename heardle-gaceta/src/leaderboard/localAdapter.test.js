import { describe, it, expect, beforeEach } from "vitest";
import { createLocalAdapter } from "./localAdapter.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

const game = (playerId, score) => ({
  playerId,
  trackId: "ISRC1",
  won: score > 0,
  stageWon: 1,
  attempts: 1,
  score,
});

let api;
beforeEach(() => {
  installLocalStorage();
  api = createLocalAdapter();
});

describe("localAdapter", () => {
  it("starts with an empty board", async () => {
    expect(await api.getTop()).toEqual([]);
  });

  it("hides players who have no alias yet", async () => {
    await api.submitGame(game("p1", 5));
    expect(await api.getTop()).toEqual([]);
  });

  it("aggregates a player's rounds once they have an alias", async () => {
    await api.setAlias("p1", "Agus");
    await api.submitGame(game("p1", 5));
    await api.submitGame(game("p1", 3));

    const [row] = await api.getTop();
    expect(row).toMatchObject({ alias: "Agus", gamesPlayed: 2, totalScore: 8, avgScore: 4 });
  });

  it("orders by total score, highest first", async () => {
    await api.setAlias("p1", "Uno");
    await api.setAlias("p2", "Dos");
    await api.submitGame(game("p1", 2));
    await api.submitGame(game("p2", 9));

    expect((await api.getTop()).map((r) => r.alias)).toEqual(["Dos", "Uno"]);
  });

  it("honours the limit", async () => {
    for (const id of ["p1", "p2", "p3"]) {
      await api.setAlias(id, `A${id}`);
      await api.submitGame(game(id, 1));
    }
    expect(await api.getTop(2)).toHaveLength(2);
  });

  it("counts a lost round as a played round worth zero", async () => {
    await api.setAlias("p1", "Agus");
    await api.submitGame(game("p1", 0));

    const [row] = await api.getTop();
    expect(row).toMatchObject({ gamesPlayed: 1, totalScore: 0, avgScore: 0 });
  });

  it("stores an email once", async () => {
    await api.subscribeEmail("a@b.com", "p1");
    await api.subscribeEmail("a@b.com", "p1");
    expect(JSON.parse(localStorage.getItem("heardle:local:emails"))).toHaveLength(1);
  });

  it("keeps the latest alias for a player", async () => {
    await api.setAlias("p1", "Viejo");
    await api.setAlias("p1", "Nuevo");
    await api.submitGame(game("p1", 1));
    expect((await api.getTop())[0].alias).toBe("Nuevo");
  });
});
