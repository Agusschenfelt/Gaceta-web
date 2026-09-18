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

export function isValidAlias(alias) {
  const a = (alias ?? "").trim();
  return a.length >= ALIAS_MIN && a.length <= ALIAS_MAX;
}

export function setAlias(alias) {
  const a = alias.trim();
  if (!isValidAlias(a)) throw new Error("Alias inválido");
  write(ALIAS_KEY, a);
  return a;
}
