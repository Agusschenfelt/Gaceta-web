import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadCatalog, loadPeaks, trackLabel } from "./loadCatalog.js";

// Degrading loudly is the point of several of these cases; the warnings are
// expected output, not signal, and they bury the run summary.
beforeEach(() => vi.spyOn(console, "warn").mockImplementation(() => {}));

function track(id, overrides = {}) {
  return {
    id,
    title: `Title ${id}`,
    artist: "Solo",
    artists: ["Solo"],
    audio_file: `/audio/${id}.mp3`,
    cover_url: `https://cdn/${id}.jpg`,
    spotify_url: `https://open.spotify.com/track/${id}`,
    release: "Album",
    release_date: "2025-01-01",
    ...overrides,
  };
}

/** Serves a catalog from a plain object; a `null` file responds 404. */
function serve(files) {
  vi.stubGlobal("fetch", async (url) => {
    const name = String(url).split("/").pop();
    const body = files[name];
    if (body === undefined || body === null) {
      return { ok: false, status: 404, json: async () => ({}) };
    }
    return { ok: true, status: 200, json: async () => body };
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("loadCatalog", () => {
  it("merges every artist file into one pool", async () => {
    serve({
      "index.json": [
        { slug: "a", name: "A", tracks: 1 },
        { slug: "b", name: "B", tracks: 1 },
      ],
      "a.json": { tracks: [track("ISRC1")] },
      "b.json": { tracks: [track("ISRC2")] },
    });

    const { artists, tracks } = await loadCatalog();
    expect(artists.map((a) => a.slug)).toEqual(["a", "b"]);
    expect(tracks).toHaveLength(2);
  });

  it("keeps a track featured on two artists once, with both slugs", async () => {
    serve({
      "index.json": [
        { slug: "a", name: "A", tracks: 1 },
        { slug: "b", name: "B", tracks: 1 },
      ],
      "a.json": { tracks: [track("SHARED")] },
      "b.json": { tracks: [track("SHARED")] },
    });

    const { tracks } = await loadCatalog();
    expect(tracks).toHaveLength(1);
    expect(tracks[0].artistSlugs).toEqual(["a", "b"]);
  });

  it("maps snake_case fields to camelCase", async () => {
    serve({
      "index.json": [{ slug: "a", name: "A", tracks: 1 }],
      "a.json": { tracks: [track("ISRC1")] },
    });

    const [t] = (await loadCatalog()).tracks;
    expect(t.audioFile).toBe("/audio/ISRC1.mp3");
    expect(t.coverUrl).toBe("https://cdn/ISRC1.jpg");
    expect(t.spotifyUrl).toBe("https://open.spotify.com/track/ISRC1");
    expect(t.releaseDate).toBe("2025-01-01");
  });

  it("falls back to the owning artist when `artists` is empty", async () => {
    serve({
      "index.json": [{ slug: "a", name: "A", tracks: 1 }],
      "a.json": { tracks: [track("ISRC1", { artists: [], artist: "Ramma" })] },
    });

    const [t] = (await loadCatalog()).tracks;
    expect(t.artists).toEqual(["Ramma"]);
  });

  it("loads the artists that resolve when one file is missing", async () => {
    serve({
      "index.json": [
        { slug: "a", name: "A", tracks: 1 },
        { slug: "gone", name: "Gone", tracks: 1 },
        { slug: "b", name: "B", tracks: 1 },
      ],
      "a.json": { tracks: [track("ISRC1")] },
      "gone.json": null,
      "b.json": { tracks: [track("ISRC2")] },
    });

    const { artists, tracks } = await loadCatalog();
    expect(tracks).toHaveLength(2);
    // A missing file must also drop the chip, or it offers an empty selection.
    expect(artists.map((a) => a.slug)).toEqual(["a", "b"]);
  });

  it("does not wait on the waveform envelopes", async () => {
    const asked = [];
    vi.stubGlobal("fetch", async (url) => {
      asked.push(String(url));
      const name = String(url).split("/").pop();
      const body = {
        "index.json": [{ slug: "a", name: "A", tracks: 1 }],
        "a.json": { tracks: [track("ISRC1")] },
      }[name];
      if (!body) return { ok: false, status: 404, json: async () => ({}) };
      return { ok: true, status: 200, json: async () => body };
    });

    const catalog = await loadCatalog();
    expect(catalog.tracks).toHaveLength(1);
    // Half the catalog's transfer is decoration; it must not gate the round.
    expect(asked.some((u) => u.includes("peaks.json"))).toBe(false);
  });

  it("throws when the index itself is missing", async () => {
    serve({ "index.json": null });
    await expect(loadCatalog()).rejects.toThrow();
  });

  it("throws when every artist file fails", async () => {
    serve({
      "index.json": [
        { slug: "a", name: "A", tracks: 1 },
        { slug: "b", name: "B", tracks: 1 },
      ],
      "a.json": null,
      "b.json": null,
    });
    await expect(loadCatalog()).rejects.toThrow();
  });
});

describe("loadPeaks", () => {
  it("returns the envelopes when they are there", async () => {
    serve({ "peaks.json": { ISRC1: [0, 128, 255] } });
    expect(await loadPeaks()).toEqual({ ISRC1: [0, 128, 255] });
  });

  it("resolves to an empty map when they are missing, never rejects", async () => {
    serve({ "peaks.json": null });
    await expect(loadPeaks()).resolves.toEqual({});
  });
});

describe("trackLabel", () => {
  it("reads as title then artists", () => {
    expect(trackLabel({ title: "INMORTAL", artists: ["Ramma", "Dazen"] })).toBe(
      "INMORTAL — Ramma, Dazen",
    );
  });
});
