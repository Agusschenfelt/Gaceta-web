const ID_KEY = "heardle:playerId";

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

/** This browser's local-mode player id (Supabase mode uses `auth.uid()` instead). */
export function getPlayerId() {
  let id = read(ID_KEY);
  if (!id) {
    id = uuid();
    write(ID_KEY, id);
  }
  return id;
}
