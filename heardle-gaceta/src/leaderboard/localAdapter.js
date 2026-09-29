/**
 * localStorage adapter. Used when Supabase is not configured so the game is
 * fully playable. The only thing it still stores is the email opt-in; round
 * history and a leaderboard used to live here too (removed, see
 * odd/tasks/remove-ranking.md).
 */
const EMAILS_KEY = "heardle:local:emails";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function createLocalAdapter() {
  return {
    name: "local",

    async subscribeEmail(email, playerId) {
      const emails = readJson(EMAILS_KEY, []);
      if (!emails.some((e) => e.email === email)) emails.push({ email, playerId });
      writeJson(EMAILS_KEY, emails);
    },
  };
}
