import { describe, it, expect } from "vitest";
import { ArbiterError, guess, skip, start, viewOf } from "./arbiter.js";
import { buildPool } from "./trackPool.js";

// A small fixed pool.
const pool = buildPool(
  [{ slug: "a" }, { slug: "b" }, { slug: "c" }],
  {
    a: { tracks: [{ id: "T1", title: "Uno" }, { id: "T2", title: "Dos" }, { id: "T3", title: "Tres" }] },
    b: { tracks: [{ id: "T3", title: "Tres" }, { id: "T4", title: "Cuatro" }] },
    c: { tracks: [{ id: "T5", title: "Cinco" }, { id: "T6", title: "Seis" }] },
  },
);

let counter = 0;
const deps = (random = () => 0) => ({
  pool,
  audioKeyFor: (isrc) => `k-${isrc}`,
  random,
  now: () => 1000,
  newId: () => `round-${++counter}`,
});

const codeOf = (fn) => {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(ArbiterError);
    return e.code;
  }
  return null;
};

/** Plays a fresh round on `trackId` so the answer is known. */
function roundOn(trackId, level = "normal") {
  const dealt = start({ artists: [], level, exclude: [] }, deps(() => 0));
  return { ...dealt.state, trackId };
}

describe("start", () => {
  it("deals a playing round that hides the answer", () => {
    const { state, view, changed } = start({ artists: ["a"] }, deps());
    expect(changed).toBe(true);
    expect(["T1", "T2", "T3"]).toContain(state.trackId);
    expect(view.status).toBe("playing");
    expect(view.answerId).toBeNull();
    expect(view.answer).toBeNull();
    expect(view.audioKey).toBe(`k-${state.trackId}`);
    expect(JSON.stringify(view)).not.toContain("Uno");
    expect(Object.keys(view).sort()).toEqual(
      ["answer", "answerId", "attempts", "audioKey", "id", "level", "score", "stageIndex", "stages", "status"],
    );
  });

  it("resumes an open round unchanged, ignoring a new filter or level", () => {
    const open = start({ artists: ["a"], level: "normal" }, deps()).state;
    const again = start({ round: open, artists: ["c"], level: "hard" }, deps());
    expect(again.changed).toBe(false);
    expect(again.state).toBe(open);
    expect(again.view.id).toBe(open.id);
    expect(again.view.level).toBe("normal");
  });

  it("deals a new round once the open one is finished", () => {
    const finished = { ...roundOn("T1"), status: "won" };
    const next = start({ round: finished }, deps());
    expect(next.changed).toBe(true);
    expect(next.state.id).not.toBe(finished.id);
  });

  it("deals a new round when the open round's track left the catalog", () => {
    const orphan = { ...roundOn("T1"), trackId: "GONE" };
    expect(start({ round: orphan }, deps()).changed).toBe(true);
  });

  it("filters by artist, with any overlap, and an empty filter means everyone", () => {
    const seen = new Set();
    for (let i = 0; i < 6; i += 1) {
      seen.add(start({ artists: ["b"] }, deps(() => i / 6)).state.trackId);
    }
    expect([...seen].sort()).toEqual(["T3", "T4"]);
    const all = new Set();
    for (let i = 0; i < 6; i += 1) all.add(start({ artists: [] }, deps(() => i / 6)).state.trackId);
    expect(all.size).toBe(6);
  });

  it("picks with the injected random source, never past the last candidate", () => {
    expect(start({ artists: ["c"] }, deps(() => 0)).state.trackId).toBe("T5");
    expect(start({ artists: ["c"] }, deps(() => 0.99)).state.trackId).toBe("T6");
    expect(start({ artists: ["c"] }, deps(() => 1)).state.trackId).toBe("T6");
  });

  it("avoids the excluded tracks, and repeats one when nothing else fits", () => {
    expect(start({ artists: ["a"], exclude: ["T1", "T2"] }, deps()).state.trackId).toBe("T3");
    expect(start({ artists: ["c"], exclude: ["T5", "T6"] }, deps()).state.trackId).toBe("T5");
  });

  it("fails with empty_pool for a filter nobody matches", () => {
    expect(codeOf(() => start({ artists: ["nobody"] }, deps()))).toBe("empty_pool");
  });

  it("validates the level: default when absent, invalid_level otherwise", () => {
    expect(start({}, deps()).view.level).toBe("normal");
    expect(start({ level: null }, deps()).view.level).toBe("normal");
    expect(start({ level: "hard" }, deps()).view.stages).toEqual([0.5, 1, 3, 8]);
    expect(codeOf(() => start({ level: "easy" }, deps()))).toBe("invalid_level");
    expect(codeOf(() => start({ level: 3 }, deps()))).toBe("invalid_level");
    expect(codeOf(() => start({ level: "toString" }, deps()))).toBe("invalid_level");
  });

  it("validates the filter: at most 50 artists of at most 64 characters, strings only", () => {
    expect(codeOf(() => start({ artists: ["x".repeat(65)] }, deps()))).toBe("invalid_filter");
    expect(codeOf(() => start({ artists: Array(51).fill("a") }, deps()))).toBe("invalid_filter");
    expect(codeOf(() => start({ artists: [1] }, deps()))).toBe("invalid_filter");
    expect(codeOf(() => start({ artists: "a" }, deps()))).toBe("invalid_filter");
    expect(codeOf(() => start({ artists: Array(50).fill("zz") }, deps()))).toBe("empty_pool");
    expect(codeOf(() => start({ artists: ["x".repeat(64)] }, deps()))).toBe("empty_pool");
  });

  it("rejects, rather than truncates, more than 20 excluded tracks or non-strings", () => {
    expect(codeOf(() => start({ exclude: Array(21).fill("T1") }, deps()))).toBe("invalid_filter");
    expect(codeOf(() => start({ exclude: [1] }, deps()))).toBe("invalid_filter");
    expect(start({ exclude: Array(20).fill("T1") }, deps()).changed).toBe(true);
  });
});

describe("guess and skip", () => {
  it("a wrong guess advances one stage and records the attempt", () => {
    const r = guess({ round: roundOn("T1"), trackId: "T2", attempt: 0 }, deps());
    expect(r.changed).toBe(true);
    expect(r.view.stageIndex).toBe(1);
    expect(r.view.status).toBe("playing");
    expect(r.view.attempts).toEqual([{ type: "guess", trackId: "T2", correct: false }]);
    expect(r.view.answerId).toBeNull();
  });

  it("a skip advances one stage", () => {
    const r = skip({ round: roundOn("T1"), attempt: 0 }, deps());
    expect(r.changed).toBe(true);
    expect(r.view.stageIndex).toBe(1);
    expect(r.view.attempts).toEqual([{ type: "skip" }]);
  });

  it("a replayed attempt (lost reply, retried) is not recorded twice", () => {
    const first = guess({ round: roundOn("T1"), trackId: "T2", attempt: 0 }, deps());
    const replay = guess({ round: first.state, trackId: "T2", attempt: 0 }, deps());
    expect(replay.changed).toBe(false);
    expect(replay.state).toBe(first.state);
    expect(replay.view.attempts).toHaveLength(1);
    const skipReplay = skip({ round: first.state, attempt: 0 }, deps());
    expect(skipReplay.changed).toBe(false);
  });

  it("an attempt count ahead of the round is also a replay, not an error", () => {
    const r = skip({ round: roundOn("T1"), attempt: 3 }, deps());
    expect(r.changed).toBe(false);
    expect(r.view.stageIndex).toBe(0);
  });

  it("a right guess after a guess and a skip wins on stage 2 and scores 2", () => {
    let round = roundOn("T1");
    round = guess({ round, trackId: "T2", attempt: 0 }, deps()).state;
    round = skip({ round, attempt: 1 }, deps()).state;
    const win = guess({ round, trackId: "T1", attempt: 2 }, deps());
    expect(win.view.status).toBe("won");
    expect(win.view.score).toBe(2);
    expect(win.view.stageIndex).toBe(2);
    expect(win.view.attempts).toHaveLength(3);
    expect(win.view.answerId).toBe("T1");
    expect(win.view.answer).toEqual({ id: "T1", title: "Uno", artistSlugs: ["a"] });
  });

  it("carries every artist slug of a collaboration in the revealed answer", () => {
    const win = guess({ round: roundOn("T3"), trackId: "T3", attempt: 0 }, deps());
    expect(win.view.answer.artistSlugs).toEqual(["a", "b"]);
  });

  it("a finished round cannot be changed", () => {
    const win = guess({ round: roundOn("T1"), trackId: "T1", attempt: 0 }, deps());
    const after = guess({ round: win.state, trackId: "T2", attempt: 1 }, deps());
    expect(after.changed).toBe(false);
    expect(after.view.status).toBe("won");
    expect(skip({ round: win.state, attempt: 1 }, deps()).changed).toBe(false);
  });

  it("four misses lose: score 0, last stage kept, answer revealed", () => {
    let round = roundOn("T2");
    for (let n = 0; n < 3; n += 1) round = skip({ round, attempt: n }, deps()).state;
    const loss = skip({ round, attempt: 3 }, deps());
    expect(loss.view.status).toBe("lost");
    expect(loss.view.score).toBe(0);
    expect(loss.view.stageIndex).toBe(3);
    expect(loss.view.answerId).toBe("T2");
  });

  it("scores the same on both levels", () => {
    for (const level of ["normal", "hard"]) {
      const firstTry = guess({ round: roundOn("T1", level), trackId: "T1", attempt: 0 }, deps());
      expect(firstTry.view.score).toBe(4);
      expect(firstTry.view.level).toBe(level);
      let round = roundOn("T1", level);
      round = skip({ round, attempt: 0 }, deps()).state;
      round = skip({ round, attempt: 1 }, deps()).state;
      expect(guess({ round, trackId: "T1", attempt: 2 }, deps()).view.score).toBe(2);
      let lost = roundOn("T1", level);
      for (let n = 0; n < 4; n += 1) lost = skip({ round: lost, attempt: n }, deps()).state;
      expect(viewOf(lost, deps()).score).toBe(0);
    }
  });

  it("uses the ladder of the round's level", () => {
    expect(viewOf(roundOn("T1", "normal"), deps()).stages).toEqual([1, 2, 4, 8]);
    expect(viewOf(roundOn("T1", "hard"), deps()).stages).toEqual([0.5, 1, 3, 8]);
  });

  it("rejects a missing round", () => {
    expect(codeOf(() => guess({ round: null, trackId: "T1", attempt: 0 }, deps()))).toBe("round_not_found");
    expect(codeOf(() => skip({ round: null, attempt: 0 }, deps()))).toBe("round_not_found");
    const orphan = { ...roundOn("T1"), trackId: "GONE" };
    expect(codeOf(() => skip({ round: orphan, attempt: 0 }, deps()))).toBe("round_not_found");
  });

  it("rejects a missing or malformed attempt count", () => {
    const round = roundOn("T1");
    for (const attempt of [undefined, null, -1, 1.5, "0", NaN]) {
      expect(codeOf(() => skip({ round, attempt }, deps()))).toBe("invalid_attempt");
      expect(codeOf(() => guess({ round, trackId: "T2", attempt }, deps()))).toBe("invalid_attempt");
    }
  });

  it("rejects a guess for a track outside the pool, but only on a live attempt", () => {
    const round = roundOn("T1");
    expect(codeOf(() => guess({ round, trackId: "NOPE", attempt: 0 }, deps()))).toBe("unknown_track");
    expect(codeOf(() => guess({ round, trackId: 7, attempt: 0 }, deps()))).toBe("unknown_track");
    expect(codeOf(() => guess({ round, trackId: undefined, attempt: 0 }, deps()))).toBe("unknown_track");
    // A replay is answered before the track is looked up, like guess_round.
    expect(guess({ round, trackId: "NOPE", attempt: 5 }, deps()).changed).toBe(false);
  });
});
