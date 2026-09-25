import { describe, it, expect } from "vitest";
import { audioKey, assertSafeConfig, publicTrack, rekeyPeaks, seedSql } from "./publish.mjs";

const track = {
  id: "UYT142400046",
  title: "INMORTAL",
  artist: "Ramma",
  artists: ["Ramma"],
  audio_file: "/audio/UYT142400046.mp3",
  cover_url: "https://i.scdn.co/x",
  spotify_url: "https://open.spotify.com/track/x",
  deezer_id: 1,
};

describe("audioKey", () => {
  it("hides the ISRC behind a keyed hash", () => {
    const key = audioKey("UYT142400046", "s3cret");
    expect(key).not.toContain("UYT");
    expect(key).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it("is stable for the same secret and different across secrets", () => {
    expect(audioKey("A", "one")).toBe(audioKey("A", "one"));
    expect(audioKey("A", "one")).not.toBe(audioKey("A", "two"));
    expect(audioKey("A", "one")).not.toBe(audioKey("B", "one"));
  });

  it("falls back to the ISRC without a secret (local development only)", () => {
    expect(audioKey("A", "")).toBe("A");
    expect(audioKey("A", undefined)).toBe("A");
  });
});

describe("assertSafeConfig", () => {
  it("allows local development without a secret", () => {
    expect(() => assertSafeConfig({ secret: "", env: {} })).not.toThrow();
  });

  it("refuses production or Supabase without a secret", () => {
    expect(() => assertSafeConfig({ secret: "", env: { VERCEL_ENV: "production" } })).toThrow();
    expect(() => assertSafeConfig({ secret: "", env: { VITE_SUPABASE_URL: "https://x" } })).toThrow();
  });

  it("accepts any environment once there is a secret", () => {
    expect(() =>
      assertSafeConfig({ secret: "s", env: { VERCEL_ENV: "production", VITE_SUPABASE_URL: "x" } })
    ).not.toThrow();
  });
});

describe("publicTrack", () => {
  it("never carries the audio path", () => {
    const out = publicTrack(track, "k", { exposeKey: false });
    expect(out).not.toHaveProperty("audio_file");
    expect(out).not.toHaveProperty("audio_key");
    expect(out).not.toHaveProperty("deezer_id");
    expect(out).toMatchObject({ id: track.id, title: "INMORTAL", cover_url: track.cover_url });
  });

  it("carries the key only when asked (local mode)", () => {
    expect(publicTrack(track, "k", { exposeKey: true }).audio_key).toBe("k");
    expect(publicTrack(track, null, { exposeKey: true })).not.toHaveProperty("audio_key");
  });
});

describe("rekeyPeaks", () => {
  it("renames by audio key and drops tracks without one", () => {
    const keys = { A: "ka" };
    expect(rekeyPeaks({ A: [1], B: [2] }, (id) => keys[id])).toEqual({ ka: [1] });
  });
});

describe("seedSql", () => {
  it("upserts every track and escapes quotes", () => {
    const sql = seedSql([
      { id: "A", audioKey: "ka", artistSlugs: ["ramma", "dazen"], title: "Don't" },
    ]);
    expect(sql).toContain("('A', 'ka', array['ramma', 'dazen']::text[], 'Don''t')");
    expect(sql).toContain("on conflict (id) do update");
    expect(sql).toMatch(/^-- Generated/);
  });

  it("writes a harmless comment when there is nothing to seed", () => {
    expect(seedSql([])).toBe("-- no playable tracks\n");
  });
});
