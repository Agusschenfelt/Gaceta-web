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
async function listRemote(token) {
  const out = new Map();
  let cursor;
  do {
    const page = await list({ prefix: BLOB_PREFIX, limit: 1000, cursor, token });
    for (const b of page.blobs) {
      const [name] = namesFromPathnames([b.pathname]);
      if (name) out.set(name, b.size);
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out;
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

  const audioFiles = (await readdir(path.join(PUBLISHED, "audio")))
    .filter((f) => f.endsWith(".mp3"))
    .map((f) => ({
      name: f,
      file: path.join(PUBLISHED, "audio", f),
      type: "audio/mpeg",
      // The key changes whenever the secret rotates, so a name never changes content.
      maxAge: 31536000,
      always: false,
    }));
  const peaksFile = {
    name: PEAKS,
    file: path.join(PUBLISHED, PEAKS),
    type: "application/json",
    maxAge: 300,
    always: true,
  };

  const remote = await listRemote(token);

  // See scripts/lib/uploadAudio.mjs and "Rotar el secreto" in CLAUDE.md for why.
  const audioNames = new Set(audioFiles.map((f) => f.name));
  const staleAudio = staleAudioNames([...remote.keys()], audioNames, PEAKS);
  const uploadPeaks = shouldUploadPeaks({ prune: PRUNE, staleAudioCount: staleAudio.length });
  const files = uploadPeaks ? [...audioFiles, peaksFile] : audioFiles;
  if (!uploadPeaks) {
    console.log(
      `upload-audio: ${staleAudio.length} stale audio key(s) still published — ` +
        `skipping ${PEAKS} until the new keys are live (rerun with --prune once they are)`
    );
  }

  let uploaded = 0;
  for (const f of files) {
    const { size } = await stat(f.file);
    if (!f.always && !needsUpload({ localSize: size, remoteSize: remote.get(f.name), force: FORCE })) continue;
    uploaded += 1;
    if (DRY) continue;
    await put(blobPathname(f.name), await readFile(f.file), {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: f.type,
      cacheControlMaxAge: f.maxAge,
      token,
    });
  }

  // peaks.json's pathname never changes, so it stays out of the prune set even
  // on a run that chose to skip re-uploading it (see uploadPeaks above).
  const stale = staleAudio;
  if (PRUNE && stale.length && !DRY) {
    for (let i = 0; i < stale.length; i += 100) {
      await del(stale.slice(i, i + 100).map(blobPathname), { token });
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
