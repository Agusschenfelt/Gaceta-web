/**
 * Shrinks the catalog previews to what the game actually plays.
 *
 * Deezer previews are 30s stereo 128kbps, but the longest stage in
 * src/game/engine.js is 15s, so everything past CLIP_SECONDS is dead weight
 * on the user's connection.
 *
 * Originals are moved to RAW_DIR (git-ignored) before re-encoding, so a
 * different clip length or bitrate can be produced later without hitting
 * Deezer again. Re-running is safe: already-compressed files are skipped.
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
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

async function encode(source, target) {
  const tmp = `${target}.tmp.mp3`;
  try {
    await run("ffmpeg", [
      "-v", "error",
      "-y",
      "-i", source,
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

  if (compressed && !FORCE) {
    if (!hasRaw) return { name, skipped: "compressed, no original kept" };
    return null;
  }

  if (DRY) return { name, before, dry: true };

  // The original is the encoding source, so it has to reach RAW_DIR first.
  if (!hasRaw) await fs.rename(target, raw);

  try {
    await encode(raw, target);
  } catch (err) {
    await fs.copyFile(raw, target);
    throw err;
  }

  return { name, before, after: await sizeOf(target) };
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
    console.log("No mp3 files in public/audio");
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

  for (const r of results) {
    if (!r) continue;
    if (r.skipped) {
      console.log(`  ! ${r.name}: ${r.skipped}`);
      warned++;
      continue;
    }
    before += r.before;
    after += r.dry ? r.before : r.after;
    touched++;
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
  console.log(`  public/audio  ${mb(total)}`);

  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
