import { describe, it, expect, beforeEach } from "vitest";
import { createLocalRounds } from "./localRounds.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

const tracks = [
  { id: "A", title: "Uno", audioKey: "ka", artistSlugs: ["ramma"] },
  { id: "B", title: "Dos", audioKey: "kb", artistSlugs: ["ramma"] },
  { id: "C", title: "Tres", audioKey: "kc", artistSlugs: ["ara"] },
  { id: "NOAUDIO", audioKey: null, artistSlugs: ["ara"] },
];

beforeEach(() => {
  installLocalStorage();
});

const make = () => createLocalRounds({ tracks });

describe("localRounds", () => {
  it("refuses to run without audio keys (published with a secret)", () => {
    expect(() =>
      createLocalRounds({ tracks: [{ id: "A", audioKey: null, artistSlugs: [] }] })
    ).toThrow(expect.objectContaining({ code: "local_unavailable" }));
  });

  it("deals a playable round from the filter and hides the answer", async () => {
    const r = await make().start(["ara"]);
    expect(r).toMatchObject({ audioKey: "kc", stageIndex: 0, status: "playing", answerId: null });
    expect(r.stages).toEqual([1, 2, 4, 8]);
    expect(r.level).toBe("normal");
  });

  it("deals the hard ladder on request and scores both levels the same way", async () => {
    const hard = make();
    const h = await hard.start(["ara"], "hard");
    expect(h).toMatchObject({ level: "hard", stages: [0.5, 1, 3, 8] });
    await hard.skip(h.id, 0);
    expect(await hard.guess(h.id, "C", 1)).toMatchObject({ status: "won", score: 3, level: "hard" });
    const normal = make();
    const n = await normal.start(["ara"], "normal");
    await normal.skip(n.id, 0);
    expect(await normal.guess(n.id, "C", 1)).toMatchObject({ status: "won", score: 3, level: "normal" });
  });

  it("keeps an open round's level when another is asked for", async () => {
    const rounds = make();
    const first = await rounds.start(["ara"], "hard");
    const again = await rounds.start(["ara"], "normal");
    expect(again).toMatchObject({ id: first.id, level: "hard", stages: [0.5, 1, 3, 8] });
  });

  it("refuses a level it does not know and treats none as the default", async () => {
    await expect(make().start([], "easy")).rejects.toMatchObject({ code: "invalid_level" });
    expect((await make().start([], null)).level).toBe("normal");
  });

  it("resumes a saved round on the level it started with, hard if it predates levels", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"], "hard");
    expect((await make().start(["ara"], "normal")).level).toBe("hard");
    // Same save, written before levels existed.
    const saved = JSON.parse(localStorage.getItem("heardle:local:round"));
    delete saved.level;
    localStorage.setItem("heardle:local:round", JSON.stringify(saved));
    expect(await make().start(["ara"], "normal")).toMatchObject({ id: r.id, level: "hard", stages: [0.5, 1, 3, 8] });
  });

  it("resumes the open round instead of dealing a new one, even after a reload", async () => {
    const first = await make().start(["ramma"]);
    await make().skip(first.id, 0).catch(() => {}); // a fresh instance knows the saved round
    const again = await make().start(["ara"]);
    expect(again.id).toBe(first.id);
    expect(again.stageIndex).toBe(1);
  });

  it("advances on a miss and reveals on a win", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    const missed = await rounds.guess(r.id, "A", 0);
    expect(missed).toMatchObject({ stageIndex: 1, status: "playing", answerId: null });
    const won = await rounds.guess(r.id, "C", 1);
    expect(won).toMatchObject({ status: "won", score: 3, answerId: "C" });
    expect(won.answer).toEqual({ id: "C", title: "Tres", artistSlugs: ["ara"] });
  });

  it("records a loss after four misses and then deals a new round", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    let last;
    for (let i = 0; i < 4; i++) last = await rounds.skip(r.id, i);
    expect(last).toMatchObject({ status: "lost", score: 0, answerId: "C" });
    expect((await rounds.start(["ara"])).id).not.toBe(r.id);
  });

  it("does not change a finished round nor accept another round's id", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    await rounds.guess(r.id, "C", 0);
    expect((await rounds.guess(r.id, "A", 1)).status).toBe("won");
    await expect(rounds.skip("someone-else", 0)).rejects.toMatchObject({ code: "round_not_found" });
  });

  it("rejects a guess that is not in the catalog", async () => {
    const rounds = make();
    const r = await rounds.start();
    await expect(rounds.guess(r.id, "ZZZ", 0)).rejects.toMatchObject({ code: "unknown_track" });
  });

  it("ignores a replayed attempt instead of recording it twice", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    await rounds.skip(r.id, 0);
    const replay = await rounds.skip(r.id, 0); // the first reply was lost
    expect(replay.attempts).toHaveLength(1);
    expect(replay.stageIndex).toBe(1);
  });

  it("rejects a missing attempt count instead of ignoring it", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    await expect(rounds.skip(r.id)).rejects.toMatchObject({ code: "invalid_attempt" });
  });

  it("hides the answer details while playing", async () => {
    expect((await make().start(["ara"])).answer).toBeNull();
  });

  it("says so when the filter leaves nothing to play", async () => {
    await expect(make().start(["nobody"])).rejects.toMatchObject({ code: "empty_pool" });
  });
});
