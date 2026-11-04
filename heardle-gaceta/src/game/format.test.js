import { describe, it, expect } from "vitest";
import { formatSeconds, levelLabel } from "./format.js";

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
