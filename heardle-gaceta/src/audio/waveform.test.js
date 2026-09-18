import { describe, it, expect } from "vitest";
import { levelAt, barHeights, BAR_COUNT } from "./waveform.js";

// Four buckets over a 4s clip: silent, half, loud, silent.
const peaks = [0, 128, 255, 0];

describe("levelAt", () => {
  it("reads the bucket covering that moment", () => {
    expect(levelAt(peaks, 0, 4)).toBe(0);
    expect(levelAt(peaks, 1.5, 4)).toBeCloseTo(128 / 255);
    expect(levelAt(peaks, 2.5, 4)).toBe(1);
  });

  it("keeps the last bucket at the very end instead of running off", () => {
    expect(levelAt(peaks, 4, 4)).toBe(0);
    expect(levelAt(peaks, 99, 4)).toBe(0);
  });

  it("returns 0 for missing or nonsensical input", () => {
    expect(levelAt(null, 1, 4)).toBe(0);
    expect(levelAt([], 1, 4)).toBe(0);
    expect(levelAt(peaks, 1, 0)).toBe(0);
    expect(levelAt(peaks, -1, 4)).toBe(0);
  });
});

describe("barHeights", () => {
  it("returns one height per bar", () => {
    expect(barHeights(peaks, 2, 4)).toHaveLength(BAR_COUNT);
    expect(barHeights(peaks, 2, 4, 3)).toHaveLength(3);
  });

  it("keeps every bar within 0..1", () => {
    for (const t of [0, 1, 2, 3, 3.99]) {
      for (const h of barHeights(peaks, t, 4)) {
        expect(h).toBeGreaterThanOrEqual(0);
        expect(h).toBeLessThanOrEqual(1);
      }
    }
  });

  it("never collapses a bar to nothing, even in silence", () => {
    for (const h of barHeights([0, 0, 0, 0], 1, 4)) expect(h).toBeGreaterThan(0);
  });

  it("is louder over a loud moment than over a silent one", () => {
    const loud = barHeights([255, 255, 255, 255], 2, 4).reduce((a, b) => a + b, 0);
    const quiet = barHeights([0, 0, 0, 0], 2, 4).reduce((a, b) => a + b, 0);
    expect(loud).toBeGreaterThan(quiet);
  });

  it("spreads the window so the bars are not all identical", () => {
    const bars = barHeights(peaks, 2, 4);
    expect(new Set(bars).size).toBeGreaterThan(1);
  });

  it("falls back to flat minimum bars when there is no envelope", () => {
    const bars = barHeights(undefined, 1, 4);
    expect(bars).toHaveLength(BAR_COUNT);
    expect(new Set(bars).size).toBe(1);
    expect(bars[0]).toBeGreaterThan(0);
  });
});
