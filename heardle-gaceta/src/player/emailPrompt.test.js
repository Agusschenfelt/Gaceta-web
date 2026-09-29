import { describe, it, expect } from "vitest";
import { shouldAskEmail, EMAIL_AFTER_ROUNDS } from "./emailPrompt.js";

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
