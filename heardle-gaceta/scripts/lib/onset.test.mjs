import { describe, expect, it } from "vitest";

import { findOnsetIndex, onsetSeconds, rmsWindows } from "./onset.mjs";

/** Builds an Int16Array: `silent` samples of digital silence, then a loud tone. */
function silenceThenTone(silent, loud, amplitude = 12000) {
  const samples = new Int16Array(silent + loud);
  for (let i = silent; i < samples.length; i++) {
    samples[i] = i % 2 === 0 ? amplitude : -amplitude;
  }
  return samples;
}

describe("rmsWindows", () => {
  it("reduces the signal to one value per window", () => {
    const samples = new Int16Array(400);
    expect(rmsWindows(samples, 100)).toHaveLength(4);
  });

  it("measures magnitude, so a symmetric wave does not cancel out", () => {
    const samples = Int16Array.from([100, -100, 100, -100]);
    expect(rmsWindows(samples, 4)[0]).toBeCloseTo(100);
  });

  it("drops the trailing partial window rather than under-reporting it", () => {
    const samples = new Int16Array(250);
    expect(rmsWindows(samples, 100)).toHaveLength(2);
  });

  it("returns nothing when there is less than one full window", () => {
    expect(rmsWindows(new Int16Array(50), 100)).toEqual([]);
  });
});

describe("findOnsetIndex", () => {
  it("returns 0 when the signal is loud from the first window", () => {
    expect(findOnsetIndex([5000, 5000, 5000])).toBe(0);
  });

  it("skips leading digital silence", () => {
    expect(findOnsetIndex([0, 0, 5000, 5000])).toBe(2);
  });

  it("reports -1 when every window is silent", () => {
    expect(findOnsetIndex([0, 0, 0])).toBe(-1);
  });

  it("trims windows that sit below the floor", () => {
    const inaudible = 20;
    const drop = 30000;
    expect(findOnsetIndex([inaudible, inaudible, drop])).toBe(2);
  });

  // A threshold set as a share of the segment's peak would call this intro
  // silent, because a loud drop later makes everything before it look like
  // nothing. The intro is audible, so it stays.
  it("keeps a quiet intro that a loud drop would otherwise dwarf", () => {
    const softIntro = 2000;
    const drop = 30000;
    expect(findOnsetIndex([softIntro, softIntro, drop])).toBe(0);
  });

  // The reason the floor is absolute. Cutting a file shifts the window, which
  // would shift a peak-relative threshold, and the head could read as silent
  // all over again — so the trim would never converge and every run would
  // re-encode the file.
  it("is stable under trimming: cutting at the onset leaves no new onset", () => {
    const rms = [10, 10, 95, 30000];
    const onset = findOnsetIndex(rms);
    expect(onset).toBe(2);
    expect(findOnsetIndex(rms.slice(onset))).toBe(0);
  });

  it("takes the floor from options", () => {
    expect(findOnsetIndex([1000, 1000, 20000], { floor: 5000 })).toBe(2);
  });

  it("has no onset in an empty signal", () => {
    expect(findOnsetIndex([])).toBe(-1);
  });
});

describe("onsetSeconds", () => {
  const sampleRate = 8000;
  const windowMs = 25;
  const perWindow = (sampleRate * windowMs) / 1000;

  it("is zero when the sound starts immediately", () => {
    const samples = silenceThenTone(0, perWindow * 4);
    expect(onsetSeconds(samples, { sampleRate, windowMs })).toBe(0);
  });

  it("converts the silent window count into seconds", () => {
    // 8 windows of 25ms before the tone starts.
    const samples = silenceThenTone(perWindow * 8, perWindow * 8);
    expect(onsetSeconds(samples, { sampleRate, windowMs })).toBeCloseTo(0.2);
  });

  it("reports a fully silent file as Infinity, never as zero", () => {
    const samples = new Int16Array(perWindow * 10);
    expect(onsetSeconds(samples, { sampleRate, windowMs })).toBe(Infinity);
  });

  it("treats a file too short to measure as starting immediately", () => {
    expect(onsetSeconds(new Int16Array(10), { sampleRate, windowMs })).toBe(0);
  });
});
