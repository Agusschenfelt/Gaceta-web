import { describe, it, expect, beforeEach } from "vitest";
import { createLocalAdapter } from "./localAdapter.js";
import { MIN_GAMES } from "./ranking.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

/** A finished round. `stageWon` null means lost. */
const round = (playerId, stageWon, extra = {}) => ({
  playerId,
  trackId: "ISRC1",
  won: stageWon !== null,
  stageWon,
  attempts: stageWon === null ? 4 : stageWon + 1,
  ...extra,
});

async function play(api, playerId, stageWon, times = MIN_GAMES) {
  for (let i = 0; i < times; i++) await api.submitGame(round(playerId, stageWon));
}

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
    await play(api, "p1", 0);
    expect(await api.getTop()).toEqual([]);
  });

  it("derives the score from the outcome and ignores a score sent by the caller", async () => {
    await api.submitGame(round("p1", 1, { score: 1000 }));
    await api.submitGame(round("p1", null, { score: 1000 }));
    expect(await api.getPlayerStats("p1")).toEqual({ gamesPlayed: 2, totalScore: 3, avgScore: 1.5 });
  });

  it("aggregates a player's rounds once they have an alias and the minimum", async () => {
    await api.setAlias("p1", "Agus");
    await play(api, "p1", 0, 3);
    await play(api, "p1", 2, 2);

    const [row] = await api.getTop();
    expect(row).toMatchObject({ alias: "Agus", gamesPlayed: 5, totalScore: 16 });
    expect(row.avgScore).toBeCloseTo(3.2);
  });

  it("keeps players below the minimum off the board but still counts them", async () => {
    await api.setAlias("p1", "Nuevo");
    await play(api, "p1", 0, MIN_GAMES - 1);
    expect(await api.getTop()).toEqual([]);
    expect((await api.getPlayerStats("p1")).gamesPlayed).toBe(MIN_GAMES - 1);
  });

  it("orders by average, so playing more does not beat guessing better", async () => {
    await api.setAlias("p1", "Mucho");
    await api.setAlias("p2", "Bien");
    await play(api, "p1", 2, 20);
    await play(api, "p2", 0);

    expect((await api.getTop()).map((r) => r.alias)).toEqual(["Bien", "Mucho"]);
  });

  it("honours the limit", async () => {
    for (const id of ["p1", "p2", "p3"]) {
      await api.setAlias(id, `A${id}`);
      await play(api, id, 0);
    }
    expect(await api.getTop(2)).toHaveLength(2);
  });

  it("counts a lost round as a played round worth zero", async () => {
    await api.setAlias("p1", "Agus");
    await play(api, "p1", null);

    const [row] = await api.getTop();
    expect(row).toMatchObject({ gamesPlayed: MIN_GAMES, totalScore: 0, avgScore: 0 });
  });

  it("reports zeros for a player who has not played", async () => {
    expect(await api.getPlayerStats("nobody")).toEqual({
      gamesPlayed: 0,
      totalScore: 0,
      avgScore: 0,
    });
  });

  it("leaves unranked rounds out of the board and the stats", async () => {
    await api.setAlias("p1", "Agus");
    await play(api, "p1", 0);
    for (let i = 0; i < 5; i++) await api.submitGame(round("p1", null, { ranked: false }));
    const [row] = await api.getTop();
    expect(row).toMatchObject({ gamesPlayed: MIN_GAMES, avgScore: 4 });
    expect((await api.getPlayerStats("p1")).gamesPlayed).toBe(MIN_GAMES);
  });

  it("stores an email once", async () => {
    await api.subscribeEmail("a@b.com", "p1");
    await api.subscribeEmail("a@b.com", "p1");
    expect(JSON.parse(localStorage.getItem("heardle:local:emails"))).toHaveLength(1);
  });

  it("keeps the latest alias for a player", async () => {
    await api.setAlias("p1", "Viejo");
    await api.setAlias("p1", "Nuevo");
    await play(api, "p1", 0);
    expect((await api.getTop())[0].alias).toBe("Nuevo");
  });
});
