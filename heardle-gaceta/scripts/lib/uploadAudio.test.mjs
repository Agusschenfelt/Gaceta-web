import { describe, it, expect } from "vitest";
import {
  staleAudioNames,
  shouldUploadPeaks,
  blobPathname,
  namesFromPathnames,
  needsUpload,
} from "./uploadAudio.mjs";

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

describe("blob pathnames", () => {
  it("prefixes names with audio/", () => {
    expect(blobPathname("a.mp3")).toBe("audio/a.mp3");
  });

  it("strips the prefix and ignores objects outside it", () => {
    expect(namesFromPathnames(["audio/a.mp3", "audio/peaks.json", "other/x.mp3"])).toEqual([
      "a.mp3",
      "peaks.json",
    ]);
  });
});

describe("needsUpload", () => {
  it("uploads what is missing", () => {
    expect(needsUpload({ localSize: 10, remoteSize: undefined, force: false })).toBe(true);
  });

  it("uploads when the size differs", () => {
    expect(needsUpload({ localSize: 10, remoteSize: 9, force: false })).toBe(true);
  });

  it("skips same pathname and same size", () => {
    expect(needsUpload({ localSize: 10, remoteSize: 10, force: false })).toBe(false);
  });

  it("--force uploads even when the size matches", () => {
    expect(needsUpload({ localSize: 10, remoteSize: 10, force: true })).toBe(true);
  });
});
