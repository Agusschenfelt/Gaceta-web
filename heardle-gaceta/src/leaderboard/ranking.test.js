import { describe, it, expect } from "vitest";
import { rankPlayers, playerStats, gamesMissing, isRankedSelection, MIN_GAMES } from "./ranking.js";

const p = (alias, gamesPlayed, totalScore) => ({ alias, gamesPlayed, totalScore });

describe("rankPlayers", () => {
  it("orders by average, not by total", () => {
    // Volume: 40 games at 2 points. Skill: 5 games at 4 points.
    const board = rankPlayers([p("Volume", 40, 80), p("Skill", 5, 20)]);
    expect(board.map((r) => r.alias)).toEqual(["Skill", "Volume"]);
    expect(board[0].avgScore).toBe(4);
  });

  it("leaves out players below the minimum of games", () => {
    const board = rankPlayers([p("Lucky", MIN_GAMES - 1, 16), p("Steady", MIN_GAMES, 10)]);
    expect(board.map((r) => r.alias)).toEqual(["Steady"]);
  });

  it("leaves out players without an alias", () => {
    expect(rankPlayers([p(null, 10, 30), p("", 10, 30)])).toEqual([]);
  });

  it("breaks a tied average by games played, then by alias", () => {
    const board = rankPlayers([p("Beta", 5, 15), p("Alfa", 5, 15), p("More", 10, 30)]);
    expect(board.map((r) => r.alias)).toEqual(["More", "Alfa", "Beta"]);
  });
});

describe("playerStats", () => {
  it("sums and averages a player's rounds", () => {
    expect(playerStats([4, 2, 0])).toEqual({ gamesPlayed: 3, totalScore: 6, avgScore: 2 });
  });

  it("is all zeros for someone who has not played", () => {
    expect(playerStats([])).toEqual({ gamesPlayed: 0, totalScore: 0, avgScore: 0 });
  });
});

describe("gamesMissing", () => {
  it("counts down to the minimum and stops at zero", () => {
    expect(gamesMissing(0)).toBe(MIN_GAMES);
    expect(gamesMissing(MIN_GAMES - 1)).toBe(1);
    expect(gamesMissing(MIN_GAMES + 3)).toBe(0);
  });
});

describe("isRankedSelection", () => {
  it("ranks every artist (empty selection) and three or more", () => {
    expect(isRankedSelection([])).toBe(true);
    expect(isRankedSelection(["ramma", "ara", "valuto"])).toBe(true);
  });

  it("does not rank one or two artists", () => {
    expect(isRankedSelection(["dazen"])).toBe(false);
    expect(isRankedSelection(["ramma", "ara"])).toBe(false);
  });

  it("counts only distinct, known artists", () => {
    expect(isRankedSelection(["ramma", "ramma", "ara"])).toBe(false);
    expect(isRankedSelection(["ramma", "ara", "nobody"], ["ramma", "ara", "valuto"])).toBe(false);
  });
});
