import { describe, it, expect, beforeEach, vi } from "vitest";
import { createLocalRounds } from "./localRounds.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

const tracks = [
  { id: "A", audioKey: "ka", artistSlugs: ["ramma"] },
  { id: "B", audioKey: "kb", artistSlugs: ["ramma"] },
  { id: "C", audioKey: "kc", artistSlugs: ["ara"] },
  { id: "NOAUDIO", audioKey: null, artistSlugs: ["ara"] },
];

let recordRound;
beforeEach(() => {
  installLocalStorage();
  recordRound = vi.fn(async () => {});
});

const make = () => createLocalRounds({ tracks, recordRound });

describe("localRounds", () => {
  it("refuses to run without audio keys (published with a secret)", () => {
    expect(() =>
      createLocalRounds({ tracks: [{ id: "A", audioKey: null, artistSlugs: [] }], recordRound })
    ).toThrow(expect.objectContaining({ code: "local_unavailable" }));
  });

  it("deals a playable round from the filter and hides the answer", async () => {
    const r = await make().start(["ara"]);
    expect(r).toMatchObject({ audioKey: "kc", stageIndex: 0, status: "playing", answerId: null });
    expect(r.stages).toEqual([0.5, 1, 3, 8]);
  });

  it("resumes the open round instead of dealing a new one, even after a reload", async () => {
    const first = await make().start(["ramma"]);
    await make().skip(first.id).catch(() => {}); // a fresh instance knows the saved round
    const again = await make().start(["ara"]);
    expect(again.id).toBe(first.id);
    expect(again.stageIndex).toBe(1);
  });

  it("advances on a miss and reveals and records on a win", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    const missed = await rounds.guess(r.id, "A");
    expect(missed).toMatchObject({ stageIndex: 1, status: "playing", answerId: null });
    const won = await rounds.guess(r.id, "C");
    expect(won).toMatchObject({ status: "won", score: 3, answerId: "C" });
    expect(recordRound).toHaveBeenCalledWith({ trackId: "C", won: true, stageWon: 1, attempts: 2 });
  });

  it("records a loss after four misses and then deals a new round", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    let last;
    for (let i = 0; i < 4; i++) last = await rounds.skip(r.id);
    expect(last).toMatchObject({ status: "lost", score: 0, answerId: "C" });
    expect(recordRound).toHaveBeenCalledWith({ trackId: "C", won: false, stageWon: null, attempts: 4 });
    expect((await rounds.start(["ara"])).id).not.toBe(r.id);
  });

  it("does not change a finished round nor accept another round's id", async () => {
    const rounds = make();
    const r = await rounds.start(["ara"]);
    await rounds.guess(r.id, "C");
    expect((await rounds.guess(r.id, "A")).status).toBe("won");
    expect(recordRound).toHaveBeenCalledTimes(1);
    await expect(rounds.skip("someone-else")).rejects.toMatchObject({ code: "round_not_found" });
  });

  it("rejects a guess that is not in the catalog", async () => {
    const rounds = make();
    const r = await rounds.start();
    await expect(rounds.guess(r.id, "ZZZ")).rejects.toMatchObject({ code: "unknown_track" });
  });

  it("says so when the filter leaves nothing to play", async () => {
    await expect(make().start(["nobody"])).rejects.toMatchObject({ code: "empty_pool" });
  });
});
