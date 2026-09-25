import { describe, it, expect } from "vitest";
import { formatSeconds } from "./format.js";

describe("formatSeconds", () => {
  it("writes whole seconds bare and fractions with one decimal", () => {
    expect(formatSeconds(0.5)).toBe("0.5");
    expect(formatSeconds(8)).toBe("8");
  });
});
