import { describe, it, expect } from "vitest";
import {
  LEVELS,
  LEVEL_IDS,
  DEFAULT_LEVEL,
  STAGE_COUNT,
  MAX_SCORE,
  getStages,
  isLevel,
  normalizeLevel,
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
const STAGES = LEVELS[DEFAULT_LEVEL];

describe("createGame", () => {
  it("starts at stage 0 on the default level's ladder", () => {
    const g = createGame({ track });
    expect(g.stageIndex).toBe(0);
    expect(g.stages).toEqual([...STAGES]);
    expect(g.status).toBe(STATUS.PLAYING);
    expect(currentClipSeconds(g)).toBe(STAGES[0]);
  });

  it("gives every player on a level the same ladder, which is what makes results comparable", () => {
    expect(createGame({ track }).stages).toEqual(createGame({ track: { id: "OTRO" } }).stages);
    expect(createGame({ track, level: "hard" }).stages).toEqual(
      createGame({ track: { id: "OTRO" }, level: "hard" }).stages,
    );
  });

  it("plays Normal [1, 2, 4, 8] by default and Difícil [0.5, 1, 3, 8] on request", () => {
    expect(DEFAULT_LEVEL).toBe("normal");
    expect(createGame({ track })).toMatchObject({ level: "normal", stages: [1, 2, 4, 8] });
    expect(createGame({ track, level: "hard" })).toMatchObject({
      level: "hard",
      stages: [0.5, 1, 3, 8],
    });
  });

  it("falls back to the default level for one it does not know", () => {
    expect(createGame({ track, level: "easy" })).toMatchObject({ level: "normal" });
    expect(getStages("nope")).toEqual([1, 2, 4, 8]);
  });

  it("hands out a copy, so a round cannot edit the ladder for everyone else", () => {
    const g = createGame({ track });
    g.stages[0] = 99;
    expect(createGame({ track }).stages[0]).toBe(STAGES[0]);
  });

  it("keeps every ladder ascending, so each failure buys more time", () => {
    for (const ladder of Object.values(LEVELS)) {
      expect(ladder.every((s, i) => i === 0 || s > ladder[i - 1])).toBe(true);
    }
  });

  it("gives every level the same stage count and the same 8 s last stage", () => {
    // Scoring and the 16 s clip/ring maths depend on both.
    for (const id of LEVEL_IDS) {
      expect(LEVELS[id]).toHaveLength(STAGE_COUNT);
      expect(LEVELS[id].at(-1)).toBe(8);
    }
    expect(MAX_SCORE).toBe(STAGE_COUNT);
  });

  it("recognises levels", () => {
    expect(LEVEL_IDS).toEqual(["normal", "hard"]);
    expect(isLevel("hard")).toBe(true);
    expect(isLevel("toString")).toBe(false);
    expect(isLevel(undefined)).toBe(false);
    expect(normalizeLevel("hard")).toBe("hard");
    expect(normalizeLevel(null)).toBe("normal");
  });

  it("hands out a copy per level too", () => {
    const g = createGame({ track, level: "hard" });
    g.stages[0] = 99;
    expect(getStages("hard")[0]).toBe(0.5);
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
      `GACETA Heardle 3/${STAGES.length} · Normal\n${pattern}\nhttps://x.test`,
    );
    expect(text).not.toContain("Secret");
  });

  it("names the level, so a result is only compared inside it", () => {
    const won = guess(createGame({ track, level: "hard" }), "ISRC1");
    expect(buildShareText({ state: won })).toBe("GACETA Heardle 1/4 · Difícil\n🟩⬜⬜⬜");
    expect(buildShareText({ state: guess(createGame({ track }), "ISRC1") })).toBe(
      "GACETA Heardle 1/4 · Normal\n🟩⬜⬜⬜",
    );
  });

  it("leaves the level out when the round does not carry one", () => {
    const { level: _level, ...legacy } = guess(createGame({ track }), "ISRC1");
    expect(buildShareText({ state: legacy })).toBe("GACETA Heardle 1/4\n🟩⬜⬜⬜");
  });

  it("marks a loss with X", () => {
    let g = createGame({ track });
    for (let i = 0; i < STAGES.length; i++) g = skip(g);
    expect(buildShareText({ state: g })).toBe(
      `GACETA Heardle X/${STAGES.length} · Normal\n${"⬛".repeat(STAGES.length)}`,
    );
  });
});

describe("scoring across levels", () => {
  it("pays 4..1 on a win and 0 on a loss on both levels", () => {
    for (const level of LEVEL_IDS) {
      for (let stage = 0; stage < STAGE_COUNT; stage++) {
        let g = createGame({ track, level });
        for (let i = 0; i < stage; i++) g = skip(g);
        expect(score(guess(g, "ISRC1"))).toBe(STAGE_COUNT - stage);
      }
      let lost = createGame({ track, level });
      for (let i = 0; i < STAGE_COUNT; i++) lost = skip(lost);
      expect(score(lost)).toBe(0);
    }
  });

  it("plays each level's own clip lengths", () => {
    let g = createGame({ track, level: "hard" });
    expect(currentClipSeconds(g)).toBe(0.5);
    g = skip(g);
    expect(currentClipSeconds(g)).toBe(1);
    g = createGame({ track });
    expect(currentClipSeconds(g)).toBe(1);
    g = skip(skip(g));
    expect(currentClipSeconds(g)).toBe(4);
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
