import { createLocalAdapter } from "../leaderboard/localAdapter.js";
import { createApiRounds } from "../rounds/apiRounds.js";
import { RoundError } from "../rounds/roundErrors.js";
import { createLocalRounds } from "../rounds/localRounds.js";
import { getPlayerId } from "../player/playerIdentity.js";

/**
 * The two ports the game talks to, picked once:
 *
 *   rounds: { mode, start(artistSlugs, level), guess(roundId, trackId, attempt), skip(roundId, attempt) }
 *           each resolving to a round view
 *           { id, audioKey, stages, level, stageIndex, attempts, status, score, answerId, answer }
 *           `level` ("normal" | "hard", default "normal") only applies to a round
 *           dealt now; an open round is resumed with the level it started on.
 *           `attempt` is attempts.length as the client saw it (makes retries safe);
 *           `answer` = { id, title, artistSlugs } once the round is over.
 *   board:  { subscribeEmail(email) }
 *
 * With VITE_ROUNDS_API=true the rounds go through the Vercel Functions in
 * api/ (takes precedence over Supabase). Emails are not wired there yet:
 * subscribeEmail rejects until /api/subscribe exists.
 *
 * With both VITE_SUPABASE_* set, everything goes through Postgres as an
 * anonymous Supabase user (loaded lazily so the base bundle never ships the
 * client). Otherwise the local services play in the browser, which only works
 * with assets published without AUDIO_KEY_SECRET: development only.
 */
export async function getGameServices({ tracks }) {
  if (import.meta.env.VITE_ROUNDS_API === "true") return createApiServices();
  const url = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  if (url && anonKey) {
    const { createSupabaseServices } = await import("./supabaseServices.js");
    return createSupabaseServices({ url, anonKey, turnstileSiteKey });
  }
  return createLocalServices({ tracks });
}

export function createLocalServices({ tracks }) {
  const store = createLocalAdapter();
  const playerId = getPlayerId();
  return {
    rounds: createLocalRounds({ tracks }),
    board: {
      subscribeEmail: (email) => store.subscribeEmail(email, playerId),
    },
  };
}

export function createApiServices(deps) {
  return {
    rounds: createApiRounds(deps),
    board: {
      subscribeEmail: async () => {
        throw new RoundError("local_unavailable");
      },
    },
  };
}
