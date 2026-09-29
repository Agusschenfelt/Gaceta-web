import { describe, it, expect } from "vitest";
import { staleAudioNames, shouldUploadPeaks } from "./uploadAudio.mjs";

describe("staleAudioNames", () => {
  it("finds remote names that are not in this publish", () => {
    const remote = ["a.mp3", "b.mp3", "peaks.json"];
    const published = new Set(["a.mp3"]);
    expect(staleAudioNames(remote, published)).toEqual(["b.mp3"]);
  });

  it("never counts peaks.json itself as stale", () => {
    const remote = ["peaks.json"];
    expect(staleAudioNames(remote, new Set())).toEqual([]);
  });

  it("is empty on a fresh bucket with nothing published yet", () => {
    expect(staleAudioNames([], new Set(["a.mp3"]))).toEqual([]);
  });
});

describe("shouldUploadPeaks", () => {
  it("uploads on a fresh publish with no stale keys", () => {
    expect(shouldUploadPeaks({ prune: false, staleAudioCount: 0 })).toBe(true);
  });

  it("skips mid-rotation, while old keys are still published", () => {
    expect(shouldUploadPeaks({ prune: false, staleAudioCount: 3 })).toBe(false);
  });

  it("uploads with --prune even while old keys are still around, to finish the rotation", () => {
    expect(shouldUploadPeaks({ prune: true, staleAudioCount: 3 })).toBe(true);
  });
});
