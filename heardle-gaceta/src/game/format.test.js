import { describe, it, expect } from "vitest";
import { LEVEL_IDS } from "./engine.js";
import { formatSeconds, levelLabel, LEVEL_LABELS } from "./format.js";

describe("formatSeconds", () => {
  it("writes whole seconds bare and fractions with one decimal", () => {
    expect(formatSeconds(0.5)).toBe("0.5");
    expect(formatSeconds(8)).toBe("8");
  });
});

describe("levelLabel", () => {
  it("names the levels in Spanish", () => {
    expect(levelLabel("normal")).toBe("Normal");
    expect(levelLabel("hard")).toBe("Difícil");
  });

  it("has no label for a round without a known level", () => {
    expect(levelLabel(undefined)).toBeNull();
    expect(levelLabel("easy")).toBeNull();
  });
});

describe("LEVEL_LABELS", () => {
  it("has a label for every engine level and no extra ones", () => {
    expect(Object.keys(LEVEL_LABELS).sort()).toEqual([...LEVEL_IDS].sort());
  });
});
