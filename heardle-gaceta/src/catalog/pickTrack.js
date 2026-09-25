const RECENT_KEY = "heardle:recent";
// Same as start_round in supabase/schema.sql: the local mode plays by the
// server's rules.
const RECENT_LIMIT = 20;

function readRecent() {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecent(ids) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(-RECENT_LIMIT)));
  } catch {
    /* storage unavailable: repeats are acceptable */
  }
}

export function filterPool(tracks, artistSlugs) {
  if (!artistSlugs || artistSlugs.length === 0) return tracks;
  const set = new Set(artistSlugs);
  return tracks.filter((t) => t.artistSlugs.some((s) => set.has(s)));
}

/** Random track from the pool, avoiding the last few played when possible. */
export function pickTrack(tracks, artistSlugs = [], random = Math.random) {
  const pool = filterPool(tracks, artistSlugs);
  if (pool.length === 0) return null;
  const recent = new Set(readRecent());
  const fresh = pool.filter((t) => !recent.has(t.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const track = candidates[Math.floor(random() * candidates.length)];
  writeRecent([...readRecent(), track.id]);
  return track;
}
