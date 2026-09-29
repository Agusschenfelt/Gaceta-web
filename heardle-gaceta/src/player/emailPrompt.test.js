import { describe, it, expect } from "vitest";
import { shouldAskEmail, nextRoundsFinished, EMAIL_AFTER_ROUNDS } from "./emailPrompt.js";

describe("shouldAskEmail", () => {
  it("waits until the round threshold is reached", () => {
    expect(shouldAskEmail({ roundsFinished: EMAIL_AFTER_ROUNDS - 1, prompt: "pending" })).toBe(
      false
    );
    expect(shouldAskEmail({ roundsFinished: EMAIL_AFTER_ROUNDS, prompt: "pending" })).toBe(true);
    expect(shouldAskEmail({ roundsFinished: EMAIL_AFTER_ROUNDS + 5, prompt: "pending" })).toBe(
      true
    );
  });

  it("never asks again once the player said yes", () => {
    expect(shouldAskEmail({ roundsFinished: 100, prompt: "done" })).toBe(false);
  });

  it("never asks again once the player dismissed it", () => {
    expect(shouldAskEmail({ roundsFinished: 100, prompt: "dismissed" })).toBe(false);
  });
});

describe("nextRoundsFinished", () => {
  it("adds one to the stored count", () => {
    expect(nextRoundsFinished(3, 3)).toBe(4);
  });

  it("keeps counting in memory when storage never persists", () => {
    // Storage always reads back 0: the in-memory count must still grow.
    let inMemory = 0;
    for (let i = 0; i < EMAIL_AFTER_ROUNDS; i += 1) inMemory = nextRoundsFinished(0, inMemory);
    expect(inMemory).toBe(EMAIL_AFTER_ROUNDS);
    expect(shouldAskEmail({ roundsFinished: inMemory, prompt: "pending" })).toBe(true);
  });

  it("treats garbage in storage as zero", () => {
    expect(nextRoundsFinished("x", 0)).toBe(1);
    expect(nextRoundsFinished(null, 2)).toBe(3);
    expect(nextRoundsFinished(-4, 0)).toBe(1);
  });
});
