/**
 * Syncs `.published/` (written by `npm run assets` with AUDIO_KEY_SECRET) to
 * the public Vercel Blob store: every `<audio key>.mp3` as `audio/<key>.mp3`
 * plus `audio/peaks.json`. The browser reads them from VITE_AUDIO_BASE_URL.
 *
 * Skips objects already there with the same pathname and size (Blob exposes
 * no content hash; see needsUpload in lib/uploadAudio.mjs). `--force` uploads
 * everything. peaks.json is always uploaded when allowed (tiny, and its
 * content can change without its size changing).
 *
 * `--prune` also deletes `audio/*.mp3` that are no longer published. Run it
 * only after the new answer keys are live: until then the round server still
 * hands out the old keys. Rotating AUDIO_KEY_SECRET is therefore:
 *
 *   set the new secret (local and Vercel) → npm run assets → npm run upload-audio
 *   → deploy the API with the new secret → npm run upload-audio -- --prune
 *
 * Needs BLOB_READ_WRITE_TOKEN (script-only: never give it a VITE_ prefix).
 *
 * Usage: npm run upload-audio [-- --prune] [--dry] [--force]
 */
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { put, list, del } from "@vercel/blob";
import {
  staleAudioNames,
  shouldUploadPeaks,
  blobPathname,
  namesFromPathnames,
  needsUpload,
  BLOB_PREFIX,
} from "./lib/uploadAudio.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLISHED = path.join(ROOT, ".published");
const PEAKS = "peaks.json";
const args = process.argv.slice(2);
const PRUNE = args.includes("--prune");
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");

async function loadEnv() {
  const raw = await readFile(path.join(ROOT, ".env"), "utf8").catch(() => "");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
}

/** Every blob under audio/, name (relative to the prefix) → size in bytes. */
export async function listRemote(client) {
  const out = new Map();
  let cursor;
  do {
    const page = await client.list({ prefix: BLOB_PREFIX, limit: 1000, cursor });
    for (const b of page.blobs) {
      const [name] = namesFromPathnames([b.pathname]);
      if (name) out.set(name, b.size);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
}

/**
 * The sync itself, with its I/O injected so it can be tested:
 * client = { list, put, del } (token already bound), fsx = { readdir, readFile, stat }.
 */
export async function runUpload({ client, fsx, publishedDir, prune, dry, force, log = console.log }) {
  const audioFiles = (await fsx.readdir(path.join(publishedDir, "audio")))
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => ({
      name: f,
      file: path.join(publishedDir, "audio", f),
      type: "audio/mpeg",
      // Objects are overwritten in place on a re-encode or --force, so keep the
      // cache short: a long one would serve stale bytes under an unchanged name.
      maxAge: 86400,
      always: false,
    }));
  const peaksFile = {
    name: PEAKS,
    file: path.join(publishedDir, PEAKS),
    type: "application/json",
    maxAge: 300,
    always: true,
  };

  const remote = await listRemote(client);

  // See scripts/lib/uploadAudio.mjs and "Rotar el secreto" in CLAUDE.md for why.
  const audioNames = new Set(audioFiles.map((f) => f.name));
  const stale = staleAudioNames([...remote.keys()], audioNames, PEAKS);
  const uploadPeaks = shouldUploadPeaks({ prune, staleAudioCount: stale.length });
  const files = uploadPeaks ? [...audioFiles, peaksFile] : audioFiles;
  if (!uploadPeaks) {
    log(
      `upload-audio: ${stale.length} stale audio key(s) still published — ` +
        `skipping ${PEAKS} until the new keys are live (rerun with --prune once they are)`
    );
  }

  let uploaded = 0;
  for (const f of files) {
    const { size } = await fsx.stat(f.file);
    if (!f.always && !needsUpload({ localSize: size, remoteSize: remote.get(f.name), force })) continue;
    uploaded += 1;
    if (dry) continue;
    await client.put(blobPathname(f.name), await fsx.readFile(f.file), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: f.type,
      cacheControlMaxAge: f.maxAge,
    });
  }

  // staleAudioNames never includes peaks.json, and only .mp3 names are deleted,
  // so prune cannot touch peaks.json or any other object.
  const removable = stale.filter((n) => n.endsWith(".mp3"));
  if (prune && removable.length && !dry) {
    for (let i = 0; i < removable.length; i += 100) {
      await client.del(removable.slice(i, i + 100).map(blobPathname));
    }
  }

  log(
    `upload-audio: ${files.length} files, ${uploaded} ${dry ? "would upload" : "uploaded"}, ` +
      `${removable.length} stale${prune ? (dry ? " would be removed" : " removed") : " (kept; --prune removes them)"}`
  );
}

async function main() {
  await loadEnv();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN is required");
  if (!process.env.AUDIO_KEY_SECRET) {
    // Without the secret the published names are ISRCs: uploading them would
    // put the answers in a public store.
    throw new Error("AUDIO_KEY_SECRET is required: run npm run assets with it first");
  }
  const client = {
    list: (o) => list({ ...o, token }),
    put: (p, body, o) => put(p, body, { ...o, token }),
    del: (p) => del(p, { token }),
  };
  await runUpload({
    client,
    fsx: { readdir, readFile, stat },
    publishedDir: PUBLISHED,
    prune: PRUNE,
    dry: DRY,
    force: FORCE,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`upload-audio: ${err.message}`);
    process.exit(1);
  });
}
