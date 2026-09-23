/**
 * Shrinks the catalog previews to what the game actually plays.
 *
 * Deezer previews are 30s stereo 128kbps. The game plays at most 8s while
 * guessing (the last of STAGES in src/game/engine.js) and 16s on the reveal,
 * so everything past CLIP_SECONDS (16) is dead weight on the user's connection.
 *
 * Originals are moved to RAW_DIR (git-ignored) before re-encoding, so a
 * different clip length or bitrate can be produced later without hitting
 * Deezer again. Re-running is safe: already-compressed files are skipped.
 *
 * It also cuts leading silence. The first stage of a round is half a second, so
 * a preview that takes a second to make a sound spends the player's first guess
 * on nothing, and the player cannot tell it was not their fault. The cut is
 * measured on the original and applied while re-encoding, which keeps the
 * runtime free of per-track offsets.
 *
 * Usage:
 *   node scripts/compress-audio.mjs
 *   node scripts/compress-audio.mjs --dry
 *   node scripts/compress-audio.mjs --force --seconds=20 --bitrate=128k
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { onsetSeconds } from "./lib/onset.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "audio");
const RAW_DIR = path.join(ROOT, "audio-raw");

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};

const DRY = flag("dry");
const FORCE = flag("force");
const CLIP_SECONDS = Number(option("seconds", "16"));
const BITRATE = option("bitrate", "96k");
const CHANNELS = 1;
const CONCURRENCY = 4;

// A preview that is already mono and no longer than the clip has been
// processed by a previous run.
const DURATION_SLACK = 0.5;

// Silence worth acting on. Under this the player never notices, and staying
// above the lead-in plus the encoder's own priming delay keeps a second run
// from finding work to redo.
const ONSET_THRESHOLD = 0.15;

// Left in front of the first sound so the track opens rather than snaps.
const LEAD_IN = 0.04;

// A file that somehow reads as silent for this long is not a late intro, it is
// a broken preview. Cutting it blind would leave the player with nothing.
const MAX_TRIM = 5;

// Enough of the head to find the onset without decoding the whole preview.
const PROBE_SECONDS = 8;
const PROBE_RATE = 8000;
const PROBE_WINDOW_MS = 25;

function run(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(stdout)
        : reject(new Error(`${cmd} exited ${code}: ${stderr.trim()}`)),
    );
  });
}

/** Same as run(), but keeps stdout as bytes. Concatenating PCM as a string corrupts it. */
function runBinary(cmd, cmdArgs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, cmdArgs);
    const chunks = [];
    let stderr = "";
    child.stdout.on("data", (d) => chunks.push(d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(chunks))
        : reject(new Error(`${cmd} exited ${code}: ${stderr.trim()}`)),
    );
  });
}

/**
 * Seconds of silence at the head of a file.
 *
 * Decodes the first PROBE_SECONDS to mono PCM and hands them to the pure onset
 * module. Infinity means the probed head is silent throughout.
 */
async function onsetOf(file) {
  const raw = await runBinary("ffmpeg", [
    "-v", "error",
    "-i", file,
    "-t", String(PROBE_SECONDS),
    "-ac", "1",
    "-ar", String(PROBE_RATE),
    "-f", "s16le",
    "-",
  ]);
  // Buffer.concat may land on an odd byte boundary; a trailing half sample is
  // not worth a copy of the whole buffer.
  const samples = new Int16Array(raw.buffer, raw.byteOffset, Math.floor(raw.length / 2));
  return onsetSeconds(samples, {
    sampleRate: PROBE_RATE,
    windowMs: PROBE_WINDOW_MS,
  });
}

/** Where to start the clip, given the onset of the source. Never past MAX_TRIM. */
function trimStart(onset) {
  if (!Number.isFinite(onset) || onset < ONSET_THRESHOLD) return 0;
  return Math.min(Math.max(onset - LEAD_IN, 0), MAX_TRIM);
}

async function probe(file) {
  const out = await run("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a:0",
    "-show_entries",
    "stream=channels",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=0",
    file,
  ]);
  const read = (key) => {
    const match = out.match(new RegExp(`^${key}=(.+)$`, "m"));
    return match ? Number(match[1]) : NaN;
  };
  return { channels: read("channels"), duration: read("duration") };
}

async function sizeOf(file) {
  const stat = await fs.stat(file);
  return stat.size;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function encode(source, target, startAt = 0) {
  const tmp = `${target}.tmp.mp3`;
  try {
    await run("ffmpeg", [
      "-v", "error",
      "-y",
      "-i", source,
      // After -i, so the seek is sample-accurate rather than snapped to a frame.
      ...(startAt > 0 ? ["-ss", startAt.toFixed(3)] : []),
      "-t", String(CLIP_SECONDS),
      "-ac", String(CHANNELS),
      "-b:a", BITRATE,
      "-map_metadata", "-1",
      tmp,
    ]);
    await fs.rename(tmp, target);
  } catch (err) {
    await fs.rm(tmp, { force: true });
    throw err;
  }
}

/**
 * Preserves the original, re-encodes in place, and reports the bytes moved.
 * Returns null when the file needs no work.
 */
async function processFile(name) {
  const target = path.join(AUDIO_DIR, name);
  const raw = path.join(RAW_DIR, name);
  const hasRaw = await exists(raw);
  const before = await sizeOf(target);
  const { channels, duration } = await probe(target);
  const compressed =
    channels === CHANNELS && duration <= CLIP_SECONDS + DURATION_SLACK;
  // Measured on what is actually served, so a file trimmed by an earlier run
  // reads as done and the script stays idempotent.
  const silentHead = (await onsetOf(target)) >= ONSET_THRESHOLD;

  if (compressed && !silentHead && !FORCE) {
    if (!hasRaw) return { name, skipped: "compressed, no original kept" };
    return null;
  }

  if (compressed && silentHead && !hasRaw) {
    return { name, skipped: "opens with silence, no original to re-cut from" };
  }

  if (DRY) return { name, before, dry: true, silentHead };

  // The original is the encoding source, so it has to reach RAW_DIR first.
  if (!hasRaw) await fs.rename(target, raw);

  // The cut is measured on the original: the served file may already be a
  // trimmed copy, and trimming a trim would walk into the song. If measuring
  // fails, the served file is only missing when this run just moved it away;
  // an existing (possibly trimmed) served file is left as it was.
  let startAt;
  try {
    startAt = trimStart(await onsetOf(raw));
  } catch (err) {
    if (!hasRaw) await fs.copyFile(raw, target);
    throw err;
  }

  // A failed encode may leave a half-written target: put the original back.
  try {
    await encode(raw, target, startAt);
  } catch (err) {
    await fs.copyFile(raw, target);
    throw err;
  }

  return { name, before, after: await sizeOf(target), startAt };
}

async function pool(items, worker) {
  const results = [];
  let cursor = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await worker(items[index]);
    }
  });
  await Promise.all(runners);
  return results;
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

async function main() {
  try {
    await run("ffmpeg", ["-version"]);
  } catch {
    console.error("ffmpeg not found. Install it with: brew install ffmpeg");
    process.exit(1);
  }

  const files = (await fs.readdir(AUDIO_DIR))
    .filter((f) => f.endsWith(".mp3"))
    .sort();

  if (!files.length) {
    console.log("No mp3 files in audio/");
    return;
  }

  await fs.mkdir(RAW_DIR, { recursive: true });

  console.log(
    `\n▶ ${files.length} files → ${CLIP_SECONDS}s, mono, ${BITRATE}${DRY ? " (dry run)" : ""}`,
  );
  console.log(`  originals kept in ${path.relative(ROOT, RAW_DIR)}/\n`);

  const failures = [];
  const results = await pool(files, async (name) => {
    try {
      return await processFile(name);
    } catch (err) {
      failures.push({ name, message: err.message });
      return null;
    }
  });

  let before = 0;
  let after = 0;
  let touched = 0;
  let warned = 0;
  const trimmed = [];

  for (const r of results) {
    if (!r) continue;
    if (r.skipped) {
      console.log(`  ! ${r.name}: ${r.skipped}`);
      warned++;
      continue;
    }
    if (r.startAt > 0) trimmed.push(r);
    before += r.before;
    after += r.dry ? r.before : r.after;
    touched++;
  }

  if (trimmed.length) {
    console.log(`  silence cut from ${trimmed.length} file(s):`);
    for (const r of trimmed) {
      console.log(`    ${r.name}  -${r.startAt.toFixed(2)}s`);
    }
  }

  for (const f of failures) console.log(`  ✗ ${f.name}: ${f.message}`);

  const total = await files.reduce(
    async (acc, name) => (await acc) + (await sizeOf(path.join(AUDIO_DIR, name))),
    Promise.resolve(0),
  );

  console.log("\nSummary");
  console.log(`  processed     ${touched}`);
  if (warned) console.log(`  no original   ${warned}`);
  if (failures.length) console.log(`  failed        ${failures.length}`);
  if (touched && !DRY) {
    const saved = before - after;
    console.log(
      `  ${mb(before)} → ${mb(after)} (-${Math.round((saved / before) * 100)}%)`,
    );
  }
  console.log(`  audio/        ${mb(total)}`);

  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
