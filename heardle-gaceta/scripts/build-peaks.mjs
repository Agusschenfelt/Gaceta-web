/**
 * Extracts a small loudness envelope for every clip in public/audio and writes
 * public/catalog/peaks.json as { "<ISRC>": [0..255 x BUCKETS] }.
 *
 * Why precompute instead of an AnalyserNode: `createMediaElementSource`
 * permanently captures the element's output, so a suspended AudioContext
 * silences the game. The visual is not worth risking the product on. Reading a
 * precomputed envelope against `currentTime` gives the same picture with no
 * effect on playback, and it is testable as a pure function.
 *
 * Usage:
 *   node scripts/build-peaks.mjs
 *   node scripts/build-peaks.mjs --force
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "public", "audio");
const OUT = path.join(ROOT, "public", "catalog", "peaks.json");

const BUCKETS = 64; // one per ~0.25s of a 16s clip
const SAMPLE_RATE = 8000; // plenty for an envelope, and fast to decode
const CONCURRENCY = 4;

const FORCE = process.argv.includes("--force");

/** Decodes to mono 16-bit PCM and reduces it to BUCKETS RMS values. */
function envelopeOf(file) {
  return new Promise((resolve, reject) => {
    const ff = spawn("ffmpeg", [
      "-v", "error",
      "-i", file,
      "-ac", "1",
      "-ar", String(SAMPLE_RATE),
      "-f", "s16le",
      "-",
    ]);
    const chunks = [];
    let stderr = "";
    ff.stdout.on("data", (c) => chunks.push(c));
    ff.stderr.on("data", (c) => (stderr += c));
    ff.on("error", reject);
    ff.on("close", (code) => {
      if (code !== 0) return reject(new Error(stderr.trim() || `ffmpeg exited ${code}`));
      const buf = Buffer.concat(chunks);
      const total = Math.floor(buf.length / 2);
      if (total === 0) return reject(new Error("no audio samples"));

      const perBucket = Math.floor(total / BUCKETS) || 1;
      const rms = [];
      for (let b = 0; b < BUCKETS; b++) {
        let sum = 0;
        let n = 0;
        const start = b * perBucket;
        const end = Math.min(start + perBucket, total);
        for (let i = start; i < end; i++) {
          const s = buf.readInt16LE(i * 2) / 32768;
          sum += s * s;
          n++;
        }
        rms.push(n ? Math.sqrt(sum / n) : 0);
      }

      // Normalise against the clip's own loudest bucket so quiet tracks still
      // fill the ring; a global scale would flatten them.
      const peak = Math.max(...rms) || 1;
      resolve(rms.map((v) => Math.round(Math.min(v / peak, 1) * 255)));
    });
  });
}

async function pool(items, worker) {
  let cursor = 0;
  const runners = Array.from({ length: CONCURRENCY }, async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  });
  await Promise.all(runners);
}

async function main() {
  let existing = {};
  if (!FORCE) {
    try {
      existing = JSON.parse(await fs.readFile(OUT, "utf8"));
    } catch {
      /* first run */
    }
  }

  const files = (await fs.readdir(AUDIO_DIR)).filter((f) => f.endsWith(".mp3")).sort();
  const todo = files.filter((f) => FORCE || !existing[path.basename(f, ".mp3")]);

  console.log(`\n▶ ${files.length} clips, ${todo.length} por procesar`);

  const peaks = { ...existing };
  const failures = [];
  let done = 0;

  await pool(todo, async (file) => {
    const id = path.basename(file, ".mp3");
    try {
      peaks[id] = await envelopeOf(path.join(AUDIO_DIR, file));
    } catch (err) {
      failures.push(`${id}: ${err.message}`);
    }
    if (++done % 50 === 0) console.log(`  ${done}/${todo.length}`);
  });

  // Drop entries whose mp3 no longer exists, so the file cannot grow forever.
  const live = new Set(files.map((f) => path.basename(f, ".mp3")));
  for (const id of Object.keys(peaks)) if (!live.has(id)) delete peaks[id];

  await fs.writeFile(OUT, JSON.stringify(peaks));
  const bytes = (await fs.stat(OUT)).size;

  console.log("\nSummary");
  console.log(`  con envolvente  ${Object.keys(peaks).length}`);
  if (failures.length) {
    console.log(`  fallaron        ${failures.length}`);
    for (const f of failures) console.log(`    ✗ ${f}`);
  }
  console.log(`  peaks.json      ${(bytes / 1024).toFixed(1)} KB`);
  if (failures.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
