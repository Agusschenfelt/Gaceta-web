import { createApiAdapter } from "../leaderboard/apiAdapter.js";
import { createLocalAdapter } from "../leaderboard/localAdapter.js";
import { createApiRounds } from "../rounds/apiRounds.js";
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
 * api/, and emails go through /api/subscribe. Otherwise the local services
 * play in the browser, which only works with assets published without
 * AUDIO_KEY_SECRET: development only.
 */
export async function getGameServices({ tracks }) {
  if (import.meta.env.VITE_ROUNDS_API === "true") return createApiServices();
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

/** `deps` ({ fetch, storage, captcha, siteKey }) are injected for tests. */
export function createApiServices(deps = {}) {
  const adapter = createApiAdapter(deps);
  return {
    rounds: createApiRounds(deps),
    board: { subscribeEmail: (email) => adapter.subscribeEmail(email) },
  };
}
