export const RECENT_KEY = "heardle:recent";
// Same as start_round in supabase/schema.sql: every mode plays by the
// server's rules.
export const RECENT_LIMIT = 20;

const storageOf = (storage) => storage ?? globalThis.localStorage;

/** Ids of the last tracks dealt to this browser, oldest first. */
export function readRecent(storage) {
  try {
    const raw = storageOf(storage).getItem(RECENT_KEY);
    const ids = raw ? JSON.parse(raw) : [];
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

/** Appends an id (moving it to the end if present) and keeps the last RECENT_LIMIT. */
export function recordRecent(id, storage) {
  try {
    const ids = [...readRecent(storage).filter((x) => x !== id), id];
    storageOf(storage).setItem(RECENT_KEY, JSON.stringify(ids.slice(-RECENT_LIMIT)));
  } catch {
    /* storage unavailable: repeats are acceptable */
  }
}
