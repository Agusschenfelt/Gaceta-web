/**
 * Syncs `.published/` (written by `npm run assets` with AUDIO_KEY_SECRET) to
 * the public Supabase Storage bucket `audio`: every `<audio key>.mp3` plus
 * `peaks.json`. Uploads only what is missing or changed (by MD5, which Storage
 * reports as the object's ETag).
 *
 * `--prune` also deletes objects that are no longer published. Run it only
 * after the new seed is loaded: until then the database still hands out the
 * old keys. Rotating AUDIO_KEY_SECRET is therefore:
 *
 *   npm run assets → npm run upload-audio → load supabase/.generated/tracks.sql
 *   → npm run upload-audio -- --prune
 *
 * Needs VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in `.env`. The service
 * role key never reaches the browser; it only runs here.
 *
 * Usage: npm run upload-audio [-- --prune] [--dry]
 */
import { readdir, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHED = path.join(ROOT, ".published");
const BUCKET = "audio";
const args = process.argv.slice(2);
const PRUNE = args.includes("--prune");
const DRY = args.includes("--dry");

async function loadEnv() {
  const raw = await readFile(path.join(ROOT, ".env"), "utf8").catch(() => "");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

const md5 = (buf) => createHash("md5").update(buf).digest("hex");

/** Every object in the bucket root, name → md5 (Storage's ETag). */
async function listRemote(storage) {
  const out = new Map();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await storage.list("", { limit: 1000, offset });
    if (error) throw error;
    for (const o of data) out.set(o.name, (o.metadata?.eTag ?? "").replaceAll('"', ""));
    if (data.length < 1000) return out;
  }
}

async function main() {
  await loadEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  if (!process.env.AUDIO_KEY_SECRET) {
    // Without the secret the published names are ISRCs: uploading them would
    // put the answers in a public bucket.
    throw new Error("AUDIO_KEY_SECRET is required: run npm run assets with it first");
  }

  const files = (await readdir(path.join(PUBLISHED, "audio")))
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => ({ name: f, file: path.join(PUBLISHED, "audio", f), type: "audio/mpeg", cache: "86400" }));
  files.push({ name: "peaks.json", file: path.join(PUBLISHED, "peaks.json"), type: "application/json", cache: "300" });

  const storage = createClient(url, serviceKey, { auth: { persistSession: false } }).storage.from(BUCKET);
  const remote = await listRemote(storage);

  let uploaded = 0;
  for (const f of files) {
    const body = await readFile(f.file);
    if (remote.get(f.name) === md5(body)) continue;
    uploaded += 1;
    if (DRY) continue;
    const { error } = await storage.upload(f.name, body, {
      contentType: f.type,
      cacheControl: f.cache,
      upsert: true,
    });
    if (error) throw new Error(`${f.name}: ${error.message}`);
  }

  const expected = new Set(files.map((f) => f.name));
  const stale = [...remote.keys()].filter((name) => !expected.has(name));
  if (PRUNE && stale.length && !DRY) {
    for (let i = 0; i < stale.length; i += 100) {
      const { error } = await storage.remove(stale.slice(i, i + 100));
      if (error) throw error;
    }
  }

  console.log(
    `upload-audio: ${files.length} files, ${uploaded} ${DRY ? "would upload" : "uploaded"}, ` +
      `${stale.length} stale${PRUNE ? (DRY ? " would be removed" : " removed") : " (kept; --prune removes them)"}`
  );
}

main().catch((err) => {
  console.error(`upload-audio: ${err.message}`);
  process.exit(1);
});
