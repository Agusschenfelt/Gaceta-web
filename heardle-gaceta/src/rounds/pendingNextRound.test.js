import { describe, it, expect } from "vitest";
import { hasPendingNextRound } from "./pendingNextRound.js";

const base = { round: { level: "normal" }, dealtFilter: ["a"], artistFilter: ["a"], level: "normal" };

describe("hasPendingNextRound", () => {
  it("is false when nothing changed", () => {
    expect(hasPendingNextRound(base)).toBe(false);
  });

  it("is false without an open round", () => {
    expect(hasPendingNextRound({ ...base, round: null, level: "hard" })).toBe(false);
  });

  it("is true when the level differs from the open round's", () => {
    expect(hasPendingNextRound({ ...base, level: "hard" })).toBe(true);
  });

  it("is false again when the level goes back to the round's", () => {
    expect(hasPendingNextRound({ ...base, level: "normal" })).toBe(false);
  });

  it("ignores the level of a round that does not carry one", () => {
    expect(hasPendingNextRound({ ...base, round: {}, level: "hard" })).toBe(false);
  });

  it("is true when the artists differ, regardless of order for equal sets", () => {
    expect(hasPendingNextRound({ ...base, artistFilter: ["a", "b"] })).toBe(true);
    expect(
      hasPendingNextRound({ ...base, dealtFilter: ["a", "b"], artistFilter: ["b", "a"] })
    ).toBe(false);
  });

  it("never counts an unknown dealt filter as a change", () => {
    expect(hasPendingNextRound({ ...base, dealtFilter: null, artistFilter: ["z"] })).toBe(false);
  });
});
