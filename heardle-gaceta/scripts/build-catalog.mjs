#!/usr/bin/env node
/**
 * Catalog builder for the Heardle game.
 *
 * Pipeline per artist (seeded in data/artists.json with a Spotify artist id):
 *   1. Spotify: list albums, singles and appearances; keep tracks where the artist is credited.
 *   2. Spotify: fetch ISRC + canonical track URL for each track (batched).
 *   3. Deezer: resolve the track by ISRC (fallback: title + artist search) to get
 *      the 30s preview MP3. Preview URLs are signed and expire, so the file is
 *      downloaded into audio/<isrc>.mp3 (shared between artists on features).
 *   4. Write data/catalog/<slug>.json (brief schema + extra metadata),
 *      data/catalog/index.json and data/missing.json for manual follow-up.
 *
 * These are sources, not what the browser gets: they map ISRC to audio, which
 * is the answer. `npm run assets` turns them into public/ (publish-assets.mjs).
 *
 * Idempotent: existing audio files are not re-downloaded.
 * Usage: npm run catalog [-- --only ramma,valuto] [--dry]
 */

import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const AUDIO_DIR = path.join(ROOT, "audio");
const CATALOG_DIR = path.join(ROOT, "data", "catalog");
const MARKET = "AR";

// ---------- CLI ----------
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const onlyIdx = args.indexOf("--only");
const ONLY = onlyIdx >= 0 ? args[onlyIdx + 1].split(",") : null;

// ---------- env ----------
async function loadEnv() {
  const raw = await readFile(path.join(ROOT, ".env"), "utf8").catch(() => "");
  for (const line of raw.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
  const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    throw new Error("Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (see .env.example)");
  }
  return { id: SPOTIFY_CLIENT_ID, secret: SPOTIFY_CLIENT_SECRET };
}

// ---------- helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const normalize = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s*[\(\[].*?[\)\]]\s*/g, " ")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

async function fetchJson(url, opts = {}, retries = 3) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, opts);
    if (res.status === 429) {
      const wait = (Number(res.headers.get("retry-after")) || 2) * 1000;
      if (wait > 120_000) {
        // Spotify dev-mode quota exhausted: retry-after can be ~24h. Bail out
        // instead of sleeping; the run is resumable with --only <pending slugs>.
        throw new Error(`QUOTA: rate limited for ${Math.round(wait / 3600_000)}h by ${url}`);
      }
      console.warn(`  429 rate limited, waiting ${wait}ms`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) {
      if (attempt < retries && res.status >= 500) {
        await sleep(500 * (attempt + 1));
        continue;
      }
      throw new Error(`${res.status} ${res.statusText} for ${url}`);
    }
    return res.json();
  }
  throw new Error(`Gave up on ${url}`);
}

async function exists(p) {
  return access(p).then(() => true, () => false);
}

// ---------- Spotify ----------
async function spotifyToken({ id, secret }) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64"),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Spotify token failed: ${res.status}`);
  return (await res.json()).access_token;
}

function spotify(token) {
  const get = (url) => fetchJson(url, { headers: { Authorization: `Bearer ${token}` } });
  const paginate = async (url) => {
    const items = [];
    let next = url;
    while (next) {
      const page = await get(next);
      items.push(...page.items);
      next = page.next;
    }
    return items;
  };
  // Development-mode apps are capped: artist albums accept limit <= 10 and the
  // batch endpoints (/tracks?ids=, /albums?ids=) return 403, so tracks are
  // fetched one by one.
  return {
    albums: (artistId) =>
      paginate(
        `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single,appears_on&limit=10&market=${MARKET}`
      ),
    albumTracks: (albumId) =>
      paginate(`https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50&market=${MARKET}`),
    tracks: async (ids) => {
      const cache = await loadTrackCache();
      const out = [];
      try {
        for (const id of ids) {
          if (!cache[id]) {
            cache[id] = await get(`https://api.spotify.com/v1/tracks/${id}?market=${MARKET}`);
            await sleep(80);
          }
          out.push(cache[id]);
        }
      } finally {
        await saveTrackCache(cache);
      }
      return out;
    },
  };
}

// Persisted so a resumed run (after a quota block) does not repeat track calls.
const TRACK_CACHE = path.join(ROOT, "data", "cache", "spotify-tracks.json");
async function loadTrackCache() {
  return JSON.parse(await readFile(TRACK_CACHE, "utf8").catch(() => "{}"));
}
async function saveTrackCache(cache) {
  await mkdir(path.dirname(TRACK_CACHE), { recursive: true });
  await writeFile(TRACK_CACHE, JSON.stringify(cache));
}

// ---------- Deezer ----------
const deezer = {
  async byIsrc(isrc) {
    const data = await fetchJson(`https://api.deezer.com/2.0/track/isrc:${isrc}`);
    return data?.error ? null : data;
  },
  async search(title, artist) {
    const q = encodeURIComponent(`artist:"${artist}" track:"${title}"`);
    const data = await fetchJson(`https://api.deezer.com/search?q=${q}&limit=5`);
    const wantedArtist = normalize(artist);
    const wantedTitle = normalize(title);
    return (
      data?.data?.find(
        (t) => normalize(t.artist.name) === wantedArtist && normalize(t.title) === wantedTitle
      ) ?? null
    );
  },
};

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`Download failed ${res.status} ${url}`);
  await mkdir(path.dirname(dest), { recursive: true });
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
}

// ---------- main ----------
async function buildArtist(artist, sp) {
  console.log(`\n▶ ${artist.name}`);
  const albums = await sp.albums(artist.spotifyArtistId);
  console.log(`  ${albums.length} releases on Spotify`);

  // Collect tracks where the artist appears (albums may include features).
  const seen = new Map(); // spotify track id -> { album }
  for (const album of albums) {
    const tracks = await sp.albumTracks(album.id);
    for (const t of tracks) {
      const involved = t.artists.some((a) => a.id === artist.spotifyArtistId);
      if (involved && !seen.has(t.id)) seen.set(t.id, { album });
    }
  }

  const full = await sp.tracks([...seen.keys()]);

  // Dedupe by ISRC (same recording released as single + album). Spotify returns
  // newest releases first, so the first occurrence is kept.
  const byIsrc = new Map();
  for (const t of full) {
    const isrc = t.external_ids?.isrc;
    if (!isrc) continue;
    if (!byIsrc.has(isrc)) byIsrc.set(isrc, t);
  }
  console.log(`  ${full.length} tracks, ${byIsrc.size} unique recordings`);

  const tracks = [];
  const missing = [];

  for (const [isrc, t] of byIsrc) {
    const { album } = seen.get(t.id);
    const artistNames = t.artists.map((a) => a.name);
    const audioRel = `/audio/${isrc}.mp3`; // shared across artists (features)
    const audioAbs = path.join(ROOT, audioRel);

    const entry = {
      id: isrc,
      title: t.name,
      artist: artist.name,
      artists: artistNames,
      audio_file: audioRel,
      cover_url: album.images?.[0]?.url ?? null,
      spotify_url: t.external_urls.spotify,
      release: album.name,
      release_date: album.release_date,
      duration_ms: t.duration_ms,
      deezer_id: null,
    };

    if (await exists(audioAbs)) {
      entry.deezer_id = "cached";
      tracks.push(entry);
      continue;
    }

    let dz = await deezer.byIsrc(isrc);
    if (!dz) {
      await sleep(120);
      dz = await deezer.search(t.name, artist.name);
    }
    await sleep(120); // stay under Deezer's 50 req / 5 s

    if (!dz?.preview) {
      console.log(`  ✗ no preview: ${t.name}`);
      missing.push({ ...entry, reason: dz ? "no_preview" : "not_on_deezer" });
      continue;
    }

    entry.deezer_id = dz.id;
    if (!DRY) {
      await download(dz.preview, audioAbs);
    }
    console.log(`  ✓ ${t.name}`);
    tracks.push(entry);
  }

  tracks.sort((a, b) => (a.release_date < b.release_date ? 1 : -1));
  return { artist: artist.name, slug: artist.slug, tracks, missing };
}

async function main() {
  const creds = await loadEnv();
  const token = await spotifyToken(creds);
  const sp = spotify(token);

  let artists = JSON.parse(await readFile(path.join(ROOT, "data", "artists.json"), "utf8"));
  if (ONLY) artists = artists.filter((a) => ONLY.includes(a.slug));

  await mkdir(CATALOG_DIR, { recursive: true });
  await mkdir(AUDIO_DIR, { recursive: true });

  const index = [];
  const allMissing = [];

  // Rebuild the index from whatever catalog files already exist so partial
  // runs (--only, or a quota abort) never drop previously built artists.
  const allArtists = JSON.parse(await readFile(path.join(ROOT, "data", "artists.json"), "utf8"));
  const previousMissing = JSON.parse(
    await readFile(path.join(ROOT, "data", "missing.json"), "utf8").catch(() => "[]")
  );
  const missingBySlug = new Map();
  for (const m of previousMissing) {
    if (!missingBySlug.has(m.artist_slug)) missingBySlug.set(m.artist_slug, []);
    missingBySlug.get(m.artist_slug).push(m);
  }

  try {
    for (const artist of artists) {
      const result = await buildArtist(artist, sp);
      if (!DRY) {
        await writeFile(
          path.join(CATALOG_DIR, `${artist.slug}.json`),
          JSON.stringify({ artist: result.artist, slug: result.slug, tracks: result.tracks }, null, 2)
        );
      }
      missingBySlug.set(
        artist.slug,
        result.missing.map((m) => ({ ...m, artist_slug: artist.slug }))
      );
    }
  } finally {
    if (!DRY) {
      for (const a of allArtists) {
        const file = path.join(CATALOG_DIR, `${a.slug}.json`);
        if (await exists(file)) {
          const data = JSON.parse(await readFile(file, "utf8"));
          index.push({ slug: a.slug, name: a.name, tracks: data.tracks.length });
        }
      }
      for (const list of missingBySlug.values()) allMissing.push(...list);
      await writeFile(path.join(CATALOG_DIR, "index.json"), JSON.stringify(index, null, 2));
      await writeFile(path.join(ROOT, "data", "missing.json"), JSON.stringify(allMissing, null, 2));
    }
  }

  console.log("\nSummary");
  for (const a of index) console.log(`  ${a.name.padEnd(14)} ${a.tracks} tracks`);
  console.log(`  missing: ${allMissing.length} (see data/missing.json)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
