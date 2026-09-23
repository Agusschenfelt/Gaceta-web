/**
 * Builds what the browser gets from the private sources, and nothing that
 * gives the answer away.
 *
 *   sources (local only, git-ignored)   →  output
 *   audio/<ISRC>.mp3                        <audio out>/<audio key>.mp3
 *   data/peaks.json  (by ISRC)              <audio out>/peaks.json (by audio key)
 *   data/catalog/*.json  (in git)           public/catalog/*.json (no audio paths)
 *                                           supabase/.generated/tracks.sql (answer key)
 *
 * The audio key is HMAC(AUDIO_KEY_SECRET, ISRC). With the secret, audio and
 * peaks go to `.published/` and `npm run upload-audio` puts them in Supabase
 * Storage; public/ gets the catalog only, so a build never ships audio. Without
 * the secret (local development), the key is the ISRC, the catalog carries it
 * and audio and peaks are served from public/. A production or Supabase build
 * refuses to run without the secret.
 *
 * On Vercel there are no sources: only the catalog is built.
 *
 * Runs before `dev` and `build`. Idempotent: an mp3 already in place with the
 * same content is not copied again, and anything stale is removed.
 *
 * Usage: npm run assets
 */
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { audioKey, assertSafeConfig, publicTrack, rekeyPeaks, seedSql } from "./lib/publish.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC_AUDIO = path.join(ROOT, "audio");
const SRC_CATALOG = path.join(ROOT, "data", "catalog");
const SRC_PEAKS = path.join(ROOT, "data", "peaks.json");
const OUT_CATALOG = path.join(ROOT, "public", "catalog");
const PUBLIC_AUDIO = path.join(ROOT, "public", "audio");
const PUBLISHED = path.join(ROOT, ".published");
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

/** Content hash, or null when the file does not exist. */
async function digest(file) {
  try {
    return createHash("sha1").update(await readFile(file)).digest("hex");
  } catch {
    return null;
  }
}

async function main() {
  await loadEnv();
  const secret = process.env.AUDIO_KEY_SECRET ?? "";
  assertSafeConfig({ secret, env: process.env });
  const exposeKey = !secret;

  const sources = await readdir(SRC_AUDIO).catch(() => null);
  const available = new Set((sources ?? []).filter((f) => f.endsWith(".mp3")).map((f) => f.slice(0, -4)));
  const keyFor = (isrc) => (available.has(isrc) ? audioKey(isrc, secret) : null);

  // Catalog: same files, minus anything that ties a track to its audio.
  const index = await readJson(path.join(SRC_CATALOG, "index.json"));
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

  if (!sources) {
    console.log("assets: catalog only (no audio/ sources here; audio is served from Supabase Storage)");
    return;
  }

  // With the secret, audio never goes into public/: it would end up in every
  // build. It is staged for upload instead, and old public copies are removed.
  const outAudio = secret ? path.join(PUBLISHED, "audio") : PUBLIC_AUDIO;
  const outPeaks = secret ? path.join(PUBLISHED, "peaks.json") : path.join(OUT_CATALOG, "peaks.json");
  if (secret) await rm(PUBLIC_AUDIO, { recursive: true, force: true });

  // Copy under the opaque name, compare by content (a re-encoded clip keeps
  // its size), and delete whatever is not expected.
  await mkdir(outAudio, { recursive: true });
  const expected = new Set();
  let copied = 0;
  for (const { id, audioKey: key } of playable.values()) {
    const from = path.join(SRC_AUDIO, `${id}.mp3`);
    const to = path.join(outAudio, `${key}.mp3`);
    expected.add(`${key}.mp3`);
    if ((await digest(to)) === (await digest(from))) continue;
    await copyFile(from, to);
    copied += 1;
  }
  let removed = 0;
  for (const f of await readdir(outAudio)) {
    if (expected.has(f)) continue;
    await rm(path.join(outAudio, f), { force: true });
    removed += 1;
  }

  const peaks = await readJson(SRC_PEAKS).catch(() => ({}));
  await writeFile(outPeaks, JSON.stringify(rekeyPeaks(peaks, keyFor)));

  await mkdir(path.dirname(OUT_SEED), { recursive: true });
  await writeFile(OUT_SEED, seedSql([...playable.values()]));

  console.log(
    `assets: ${playable.size} playable tracks, ${copied} mp3 copied, ${removed} removed, ` +
      (secret
        ? "opaque audio keys staged in .published/ (npm run upload-audio)"
        : "ISRC keys in public/ (local mode, no AUDIO_KEY_SECRET)")
  );
}

main().catch((err) => {
  console.error(`assets: ${err.message}`);
  process.exit(1);
});
