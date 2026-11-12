/**
 * The tracks the server can deal: { id (ISRC), title, artistSlugs }. Nothing
 * else, and nothing that links a track to its audio (that link is derived at
 * runtime from AUDIO_KEY_SECRET, see config.js).
 *
 * Source: the git-tracked catalog in data/catalog/. The files are imported
 * statically so Vercel's bundler traces and ships them with the functions; no
 * runtime file reads, no includeFiles to forget. The price is that a new artist
 * has to be added to ARTIST_FILES; trackPool.test.js fails if the list and
 * data/catalog/index.json disagree.
 *
 * Merging mirrors src/catalog/loadCatalog.js: deduplicated by ISRC, a track
 * featured on several artists' files keeps every slug, in index order.
 */
import index from "../../data/catalog/index.json" with { type: "json" };
import ara from "../../data/catalog/ara.json" with { type: "json" };
import barta from "../../data/catalog/barta.json" with { type: "json" };
import dazen from "../../data/catalog/dazen.json" with { type: "json" };
import fosse from "../../data/catalog/fosse.json" with { type: "json" };
import lonzo from "../../data/catalog/lonzo.json" with { type: "json" };
import ramma from "../../data/catalog/ramma.json" with { type: "json" };
import tadu from "../../data/catalog/tadu.json" with { type: "json" };
import valuto from "../../data/catalog/valuto.json" with { type: "json" };

export const ARTIST_FILES = { ara, barta, dazen, fosse, lonzo, ramma, tadu, valuto };

/** The pool from the catalog index and its artist files, keyed by slug. */
export function buildPool(catalogIndex, files) {
  const byId = new Map();
  for (const { slug } of catalogIndex) {
    const file = files[slug];
    if (!file) continue;
    for (const t of file.tracks) {
      const existing = byId.get(t.id);
      if (existing) {
        if (!existing.artistSlugs.includes(slug)) existing.artistSlugs.push(slug);
        continue;
      }
      byId.set(t.id, { id: t.id, title: t.title, artistSlugs: [slug] });
    }
  }
  return { tracks: [...byId.values()], byId };
}

export const catalogPool = buildPool(index, ARTIST_FILES);
