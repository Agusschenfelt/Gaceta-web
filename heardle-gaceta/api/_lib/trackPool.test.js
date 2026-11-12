import { describe, it, expect } from "vitest";
import { readdirSync } from "node:fs";
import { ARTIST_FILES, buildPool, catalogPool } from "./trackPool.js";
import index from "../../data/catalog/index.json" with { type: "json" };

describe("buildPool", () => {
  it("deduplicates by ISRC and keeps every artist slug", () => {
    const pool = buildPool(
      [{ slug: "a" }, { slug: "b" }, { slug: "gone" }],
      {
        a: { tracks: [{ id: "T1", title: "Uno", extra: "x" }, { id: "T2", title: "Dos" }] },
        b: { tracks: [{ id: "T1", title: "Uno" }, { id: "T3", title: "Tres" }] },
      },
    );
    expect(pool.tracks).toEqual([
      { id: "T1", title: "Uno", artistSlugs: ["a", "b"] },
      { id: "T2", title: "Dos", artistSlugs: ["a"] },
      { id: "T3", title: "Tres", artistSlugs: ["b"] },
    ]);
    expect(pool.byId.get("T3").title).toBe("Tres");
  });
});

describe("catalog pool", () => {
  it("bundles an artist file for every artist in the index", () => {
    expect(Object.keys(ARTIST_FILES).sort()).toEqual(index.map((a) => a.slug).sort());
    const onDisk = readdirSync(new URL("../../data/catalog/", import.meta.url))
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .map((f) => f.slice(0, -5));
    expect(Object.keys(ARTIST_FILES).sort()).toEqual(onDisk.sort());
  });

  it("holds only id, title and artist slugs, with unique ISRCs", () => {
    expect(catalogPool.tracks.length).toBeGreaterThan(0);
    expect(new Set(catalogPool.tracks.map((t) => t.id)).size).toBe(catalogPool.tracks.length);
    for (const t of catalogPool.tracks) {
      expect(Object.keys(t).sort()).toEqual(["artistSlugs", "id", "title"]);
    }
  });
});
