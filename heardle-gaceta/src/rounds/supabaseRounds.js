import { DEFAULT_LEVEL } from "../game/engine.js";
import { toRoundError } from "./roundErrors.js";

/**
 * Rounds dealt and judged by Postgres (supabase/schema.sql). The browser only
 * ever holds the round's audio key; the answer arrives once the round is over.
 */
export function createSupabaseRounds(client) {
  async function call(fn, args) {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw toRoundError(error);
    return data;
  }

  return {
    mode: "supabase",
    // The level only applies to a round that is dealt now; an open one keeps its own.
    start: (artistSlugs = [], level = DEFAULT_LEVEL) =>
      call("start_round", { p_artists: artistSlugs, p_level: level }),
    // `attempt` = attempts the client has seen; lets the server ignore a retry
    // of an attempt it already recorded.
    guess: (roundId, trackId, attempt) =>
      call("guess_round", { p_round: roundId, p_track: trackId, p_attempt: attempt }),
    skip: (roundId, attempt) => call("skip_round", { p_round: roundId, p_attempt: attempt }),
  };
}
