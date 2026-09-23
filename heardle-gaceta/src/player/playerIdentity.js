const ID_KEY = "heardle:playerId";
const ALIAS_KEY = "heardle:alias";

export const ALIAS_MIN = 2;
export const ALIAS_MAX = 16;

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  // Fallback for very old browsers.
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getPlayerId() {
  let id = read(ID_KEY);
  if (!id) {
    id = uuid();
    write(ID_KEY, id);
  }
  return id;
}

export function getAlias() {
  return read(ALIAS_KEY) || "";
}

/**
 * ASCII letters and digits, the Latin-1 and Latin Extended-A letters (á, é,
 * ñ, ü…), spaces, dots, underscores and dashes. Spelled out rather than
 * \p{L} so it is exactly the set `set_alias` enforces in supabase/schema.sql,
 * whatever the database locale. The database also refuses blocked words and
 * taken names, which only it can know.
 */
export const ALIAS_SHAPE = new RegExp(`^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{${ALIAS_MIN},${ALIAS_MAX}}$`, "u");

export function normalizeAlias(alias) {
  return (alias ?? "").trim().replace(/\s+/g, " ");
}

export function isValidAlias(alias) {
  return ALIAS_SHAPE.test(normalizeAlias(alias));
}

export function setAlias(alias) {
  const a = normalizeAlias(alias);
  if (!isValidAlias(a)) throw new Error("Alias inválido");
  write(ALIAS_KEY, a);
  return a;
}
