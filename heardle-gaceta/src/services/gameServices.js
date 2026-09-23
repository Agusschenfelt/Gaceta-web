import { createLocalAdapter } from "../leaderboard/localAdapter.js";
import { createLocalRounds } from "../rounds/localRounds.js";
import { getPlayerId } from "../player/playerIdentity.js";

/**
 * The two ports the game talks to, picked once:
 *
 *   rounds: { mode, start(artistSlugs), guess(roundId, trackId, attempt), skip(roundId, attempt) }
 *           each resolving to a round view
 *           { id, audioKey, stages, stageIndex, attempts, status, score, answerId, answer }
 *           `attempt` is attempts.length as the client saw it (makes retries safe);
 *           `answer` = { id, title, artistSlugs } once the round is over.
 *   board:  { getTop(limit), getPlayerStats(), setAlias(alias), subscribeEmail(email) }
 *
 * With both VITE_SUPABASE_* set, everything goes through Postgres as an
 * anonymous Supabase user (loaded lazily so the base bundle never ships the
 * client). Otherwise the local services play in the browser, which only works
 * with assets published without AUDIO_KEY_SECRET: development only.
 */
export async function getGameServices({ tracks }) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (url && anonKey) {
    const { createSupabaseServices } = await import("./supabaseServices.js");
    return createSupabaseServices({ url, anonKey });
  }
  return createLocalServices({ tracks });
}

export function createLocalServices({ tracks }) {
  const store = createLocalAdapter();
  const playerId = getPlayerId();
  return {
    rounds: createLocalRounds({
      tracks,
      recordRound: (round) => store.submitGame({ playerId, ...round }),
      hasPlayed: (trackId) => store.hasPlayed(playerId, trackId),
    }),
    board: {
      getTop: (limit) => store.getTop(limit),
      getPlayerStats: () => store.getPlayerStats(playerId),
      async setAlias(alias) {
        await store.setAlias(playerId, alias);
        return alias;
      },
      subscribeEmail: (email) => store.subscribeEmail(email, playerId),
    },
  };
}
