/**
 * localStorage adapter. Used when Supabase is not configured so the game is
 * fully playable. The "ranking" only ever contains this device's player.
 */
const GAMES_KEY = "heardle:local:games";
const EMAILS_KEY = "heardle:local:emails";
const ALIASES_KEY = "heardle:local:aliases";

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

    async submitGame(game) {
      const games = readJson(GAMES_KEY, []);
      games.push({ ...game, createdAt: Date.now() });
      writeJson(GAMES_KEY, games);
    },

    async setAlias(playerId, alias) {
      const aliases = readJson(ALIASES_KEY, {});
      aliases[playerId] = alias;
      writeJson(ALIASES_KEY, aliases);
    },

    async getTop(limit = 20) {
      const games = readJson(GAMES_KEY, []);
      const aliases = readJson(ALIASES_KEY, {});
      const byPlayer = new Map();
      for (const g of games) {
        const alias = aliases[g.playerId];
        if (!alias) continue;
        const row = byPlayer.get(g.playerId) ?? { alias, gamesPlayed: 0, totalScore: 0 };
        row.gamesPlayed += 1;
        row.totalScore += g.score;
        byPlayer.set(g.playerId, row);
      }
      return [...byPlayer.values()]
        .map((r) => ({ ...r, avgScore: r.gamesPlayed ? r.totalScore / r.gamesPlayed : 0 }))
        .sort((a, b) => b.totalScore - a.totalScore)
        .slice(0, limit);
    },

    async subscribeEmail(email, playerId) {
      const emails = readJson(EMAILS_KEY, []);
      if (!emails.some((e) => e.email === email)) emails.push({ email, playerId });
      writeJson(EMAILS_KEY, emails);
    },
  };
}
