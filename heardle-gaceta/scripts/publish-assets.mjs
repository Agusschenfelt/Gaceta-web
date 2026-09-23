/**
 * Builds public/ from the private sources, so the browser gets everything it
 * needs to play and nothing that gives the answer away.
 *
 *   sources (in git)            →  public/ (generated, git-ignored)
 *   audio/<ISRC>.mp3                public/audio/<audio key>.mp3
 *   data/catalog/*.json             public/catalog/*.json   (no audio paths)
 *   data/peaks.json  (by ISRC)      public/catalog/peaks.json (by audio key)
 *                                   supabase/.generated/tracks.sql (answer key, never commit)
 *
 * The audio key is HMAC(AUDIO_KEY_SECRET, ISRC). Without the secret it falls
 * back to the ISRC and the catalog carries it, which is what local mode needs
 * to deal rounds in the browser; a production or Supabase build refuses to run
 * that way.
 *
 * Runs before `dev` and `build`. Idempotent: an mp3 already in place with the
 * same size is not copied again, and anything stale is removed.
 *
 * Usage: npm run assets
 */
import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { audioKey, assertSafeConfig, publicTrack, rekeyPeaks, seedSql } from "./lib/publish.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_AUDIO = path.join(ROOT, "audio");
const SRC_CATALOG = path.join(ROOT, "data", "catalog");
const SRC_PEAKS = path.join(ROOT, "data", "peaks.json");
const OUT_AUDIO = path.join(ROOT, "public", "audio");
const OUT_CATALOG = path.join(ROOT, "public", "catalog");
const OUT_SEED = path.join(ROOT, "supabase", ".generated", "tracks.sql");

/** Same `.env` reading as build-catalog: real env vars win over the file. */
async function loadEnv() {
  const raw = await readFile(path.join(ROOT, ".env"), "utf8").catch(() => "");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const readJson = async (file) => JSON.parse(await readFile(file, "utf8"));

async function sizeOf(file) {
  try {
    return (await stat(file)).size;
  } catch {
    return -1;
  }
}

async function main() {
  await loadEnv();
  const secret = process.env.AUDIO_KEY_SECRET ?? "";
  assertSafeConfig({ secret, env: process.env });
  const exposeKey = !secret;

  const index = await readJson(path.join(SRC_CATALOG, "index.json"));
  const available = new Set(
    (await readdir(SRC_AUDIO)).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4))
  );
  const keyFor = (isrc) => (available.has(isrc) ? audioKey(isrc, secret) : null);

  // Catalog: same files, minus anything that ties a track to its audio.
  await rm(OUT_CATALOG, { recursive: true, force: true });
  await mkdir(OUT_CATALOG, { recursive: true });
  await writeFile(path.join(OUT_CATALOG, "index.json"), JSON.stringify(index));

  const playable = new Map(); // ISRC → { id, title, artistSlugs, audioKey }
  for (const { slug } of index) {
    const file = await readJson(path.join(SRC_CATALOG, `${slug}.json`));
    const tracks = file.tracks.map((t) => publicTrack(t, keyFor(t.id), { exposeKey }));
    await writeFile(path.join(OUT_CATALOG, `${slug}.json`), JSON.stringify({ ...file, tracks }));
    for (const t of file.tracks) {
      const key = keyFor(t.id);
      if (!key) continue;
      const entry = playable.get(t.id) ?? { id: t.id, title: t.title, artistSlugs: [], audioKey: key };
      if (!entry.artistSlugs.includes(slug)) entry.artistSlugs.push(slug);
      playable.set(t.id, entry);
    }
  }

  // Audio: copy under the opaque name and delete whatever is not expected,
  // so switching the secret on never leaves ISRC-named files behind.
  await mkdir(OUT_AUDIO, { recursive: true });
  const expected = new Set();
  let copied = 0;
  for (const { id, audioKey: key } of playable.values()) {
    const from = path.join(SRC_AUDIO, `${id}.mp3`);
    const to = path.join(OUT_AUDIO, `${key}.mp3`);
    expected.add(`${key}.mp3`);
    if ((await sizeOf(to)) === (await sizeOf(from))) continue;
    await copyFile(from, to);
    copied += 1;
  }
  let removed = 0;
  for (const f of await readdir(OUT_AUDIO)) {
    if (expected.has(f)) continue;
    await rm(path.join(OUT_AUDIO, f), { force: true });
    removed += 1;
  }

  const peaks = await readJson(SRC_PEAKS).catch(() => ({}));
  await writeFile(path.join(OUT_CATALOG, "peaks.json"), JSON.stringify(rekeyPeaks(peaks, keyFor)));

  await mkdir(path.dirname(OUT_SEED), { recursive: true });
  await writeFile(OUT_SEED, seedSql([...playable.values()]));

  console.log(
    `assets: ${playable.size} playable tracks, ${copied} mp3 copied, ${removed} removed` +
      (secret ? ", opaque audio keys" : ", ISRC keys (local mode, no AUDIO_KEY_SECRET)")
  );
}

main().catch((err) => {
  console.error(`assets: ${err.message}`);
  process.exit(1);
});
