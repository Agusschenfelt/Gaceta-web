import { describe, it, expect } from "vitest";
import { levelAt, barHeights, BAR_COUNT, ringTicks, unlockedTicks, levelFromBar, MIN_HEIGHT } from "./waveform.js";

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

describe("ringTicks", () => {
  // 16 buckets over a 16s file: one per second, loud only at seconds 2 and 5.
  const file = Array.from({ length: 16 }, (_, i) => (i === 2 ? 200 : i === 5 ? 100 : 0));

  it("returns one tick per slot, all within the minimum and 1", () => {
    const ticks = ringTicks(file, 8, 32, 16);
    expect(ticks).toHaveLength(32);
    for (const t of ticks) {
      expect(t).toBeGreaterThanOrEqual(0.12);
      expect(t).toBeLessThanOrEqual(1);
    }
  });

  it("only reads the first `span` seconds and normalises inside them", () => {
    // Over 8 ticks of 1s each, tick 2 is the loudest and reaches full length.
    const ticks = ringTicks(file, 8, 8, 16);
    expect(ticks[2]).toBe(1);
    expect(ticks[5]).toBeCloseTo(0.12 + 0.5 * 0.88);
    expect(ticks[7]).toBeCloseTo(0.12);
  });

  it("interpolates between buckets instead of repeating them", () => {
    const ticks = ringTicks([0, 255], 2, 4, 2);
    expect(new Set(ticks.map((t) => t.toFixed(3))).size).toBeGreaterThan(2);
  });

  it("draws a flat outline for missing, silent or nonsensical input", () => {
    expect(ringTicks(null, 8, 4)).toEqual([0.12, 0.12, 0.12, 0.12]);
    expect(ringTicks([0, 0, 0], 8, 3)).toEqual([0.12, 0.12, 0.12]);
    expect(ringTicks(file, 0, 2)).toEqual([0.12, 0.12]);
  });
});

describe("unlockedTicks", () => {
  it("maps each stage to its share of the ring", () => {
    expect(unlockedTicks(0.5, 8, 64)).toBe(4);
    expect(unlockedTicks(1, 8, 64)).toBe(8);
    expect(unlockedTicks(3, 8, 64)).toBe(24);
    expect(unlockedTicks(8, 8, 64)).toBe(64);
  });

  it("never exceeds the ring and is zero for nothing", () => {
    expect(unlockedTicks(20, 8, 64)).toBe(64);
    expect(unlockedTicks(0, 8, 64)).toBe(0);
  });
});

describe("levelFromBar", () => {
  it("maps the floored bar height back to 0..1", () => {
    expect(levelFromBar(MIN_HEIGHT)).toBe(0);
    expect(levelFromBar(1)).toBe(1);
    expect(levelFromBar(0)).toBe(0);
    expect(levelFromBar(barHeights([255], 0, 1, 1)[0])).toBe(1);
  });
});
