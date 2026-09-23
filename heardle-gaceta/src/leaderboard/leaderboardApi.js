import { createLocalAdapter } from "./localAdapter.js";

/**
 * Port: { name, submitGame(game), setAlias(playerId, alias), getTop(limit),
 *         getPlayerStats(playerId), subscribeEmail(email, playerId) }
 * game = { playerId, trackId, won, stageWon, attempts }
 *
 * No score in `game`: each adapter derives it from the outcome (`scoreFor`),
 * so a tampered client cannot post points. `getTop` returns only players with
 * an alias and at least `MIN_GAMES` rounds, ranked by average (see
 * ranking.js). `getPlayerStats` → { gamesPlayed, totalScore, avgScore }.
 *
 * Picks Supabase when both env vars exist (loaded lazily so the base bundle
 * never ships the client), otherwise the localStorage adapter.
 */
let instance = null;

export async function getLeaderboardApi() {
  if (instance) return instance;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const { createSupabaseAdapter } = await import("./supabaseAdapter.js");
    instance = createSupabaseAdapter({ url, anonKey });
  } else {
    instance = createLocalAdapter();
  }
  return instance;
}
