import { describe, it, expect } from "vitest";
import {
  STAGES,
  MAX_SCORE,
  STATUS,
  createGame,
  guess,
  skip,
  currentClipSeconds,
  score,
  scoreFor,
  attemptsUsed,
  stageWon,
  isOver,
} from "./engine.js";
import { buildShareText, buildPattern } from "./share.js";

const track = { id: "ISRC1", title: "Secret" };

describe("createGame", () => {
  it("starts at stage 0 on the shared ladder", () => {
    const g = createGame({ track });
    expect(g.stageIndex).toBe(0);
    expect(g.stages).toEqual([...STAGES]);
    expect(g.status).toBe(STATUS.PLAYING);
    expect(currentClipSeconds(g)).toBe(STAGES[0]);
  });

  it("gives every player the same ladder, which is what makes results comparable", () => {
    expect(createGame({ track }).stages).toEqual(createGame({ track: { id: "OTRO" } }).stages);
  });

  it("hands out a copy, so a round cannot edit the ladder for everyone else", () => {
    const g = createGame({ track });
    g.stages[0] = 99;
    expect(createGame({ track }).stages[0]).toBe(STAGES[0]);
  });

  it("keeps the ladder ascending, so each failure buys more time", () => {
    expect(STAGES.every((s, i) => i === 0 || s > STAGES[i - 1])).toBe(true);
  });

  it("refuses a track with no id", () => {
    expect(() => createGame({ track: null })).toThrow();
    expect(() => createGame({ track: {} })).toThrow();
  });
});

describe("guess", () => {
  it("wins on a correct guess and scores by stage", () => {
    const g = guess(createGame({ track }), "ISRC1");
    expect(g.status).toBe(STATUS.WON);
    expect(score(g)).toBe(MAX_SCORE);
    expect(stageWon(g)).toBe(0);
    expect(attemptsUsed(g)).toBe(1);
    expect(isOver(g)).toBe(true);
  });

  it("advances a stage on a wrong guess", () => {
    const g = guess(createGame({ track }), "OTHER");
    expect(g.status).toBe(STATUS.PLAYING);
    expect(g.stageIndex).toBe(1);
    expect(currentClipSeconds(g)).toBe(STAGES[1]);
    expect(g.attempts[0]).toEqual({ type: "guess", trackId: "OTHER", correct: false });
  });

  it("loses after exhausting every stage", () => {
    let g = createGame({ track });
    for (let i = 0; i < STAGES.length; i++) g = guess(g, "OTHER");
    expect(g.status).toBe(STATUS.LOST);
    expect(score(g)).toBe(0);
    expect(stageWon(g)).toBeNull();
    // Further input is ignored once the game is over.
    expect(guess(g, "ISRC1").status).toBe(STATUS.LOST);
  });

  it("scores 1 when winning on the last stage", () => {
    let g = createGame({ track });
    for (let i = 0; i < STAGES.length - 1; i++) g = skip(g);
    g = guess(g, "ISRC1");
    expect(g.status).toBe(STATUS.WON);
    expect(score(g)).toBe(1);
  });

  it("does not mutate the previous state", () => {
    const g0 = createGame({ track });
    guess(g0, "OTHER");
    expect(g0.stageIndex).toBe(0);
    expect(g0.attempts).toEqual([]);
  });
});

describe("skip", () => {
  it("advances without a guess and can lose the game", () => {
    let g = skip(createGame({ track }));
    expect(g.attempts).toEqual([{ type: "skip" }]);
    expect(g.stageIndex).toBe(1);
    for (let i = 1; i < STAGES.length; i++) g = skip(g);
    expect(g.status).toBe(STATUS.LOST);
  });
});

describe("share", () => {
  it("renders the attempt pattern without the title", () => {
    let g = createGame({ track });
    g = guess(g, "OTHER");
    g = skip(g);
    g = guess(g, "ISRC1");
    // One square per stage: wrong, skipped, right, then the unused ones.
    const unused = "⬜".repeat(STAGES.length - 3);
    const pattern = `🟥⬛🟩${unused}`;
    expect(buildPattern(g)).toBe(pattern);
    const text = buildShareText({ state: g, url: "https://x.test" });
    expect(text).toBe(
      `GACETA Heardle 3/${STAGES.length}\n${pattern}\nhttps://x.test`,
    );
    expect(text).not.toContain("Secret");
  });

  it("marks a loss with X", () => {
    let g = createGame({ track });
    for (let i = 0; i < STAGES.length; i++) g = skip(g);
    expect(buildShareText({ state: g })).toBe(
      `GACETA Heardle X/${STAGES.length}\n${"⬛".repeat(STAGES.length)}`,
    );
  });
});

describe("scoreFor", () => {
  it("pays more for an earlier win", () => {
    expect(scoreFor(true, 0)).toBe(4);
    expect(scoreFor(true, 1)).toBe(3);
    expect(scoreFor(true, 3)).toBe(1);
  });

  it("scores a loss as zero, whatever stage it names", () => {
    expect(scoreFor(false, null)).toBe(0);
    expect(scoreFor(false, 0)).toBe(0);
  });

  it("scores an impossible outcome as zero instead of trusting it", () => {
    expect(scoreFor(true, 4)).toBe(0);
    expect(scoreFor(true, -1)).toBe(0);
    expect(scoreFor(true, 1.5)).toBe(0);
    expect(scoreFor(true, null)).toBe(0);
    expect(scoreFor(true, "0")).toBe(0);
  });

  it("agrees with score() on a finished game", () => {
    const won = guess(createGame({ track: { id: "A" } }), "A");
    expect(score(won)).toBe(scoreFor(true, 0));
  });
});
