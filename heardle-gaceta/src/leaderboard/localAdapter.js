import { scoreFor } from "../game/engine.js";
import { rankPlayers, playerStats } from "./ranking.js";

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
      // Same rule as the database: the score comes from the outcome, never
      // from the caller.
      const { score: _ignored, ...outcome } = game;
      games.push({
        ...outcome,
        ranked: game.ranked !== false,
        score: scoreFor(game.won, game.stageWon),
        createdAt: Date.now(),
      });
      writeJson(GAMES_KEY, games);
    },

    /** Whether this player has any earlier recorded round (won, lost, or
     * either kind of repeat) for this track. Used to keep a track's second
     * play out of the ranking; see isRankedRound in ranking.js. */
    async hasPlayed(playerId, trackId) {
      const games = readJson(GAMES_KEY, []);
      return games.some((g) => g.playerId === playerId && g.trackId === trackId);
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
      // Only ranked rounds feed the board (see isRankedSelection).
      for (const g of games.filter((x) => x.ranked !== false)) {
        const row = byPlayer.get(g.playerId) ?? {
          alias: aliases[g.playerId],
          gamesPlayed: 0,
          totalScore: 0,
        };
        row.gamesPlayed += 1;
        row.totalScore += g.score;
        byPlayer.set(g.playerId, row);
      }
      return rankPlayers([...byPlayer.values()]).slice(0, limit);
    },

    async getPlayerStats(playerId) {
      const games = readJson(GAMES_KEY, []);
      return playerStats(
        games.filter((g) => g.playerId === playerId && g.ranked !== false).map((g) => g.score)
      );
    },

    async subscribeEmail(email, playerId) {
      const emails = readJson(EMAILS_KEY, []);
      if (!emails.some((e) => e.email === email)) emails.push({ email, playerId });
      writeJson(EMAILS_KEY, emails);
    },
  };
}
