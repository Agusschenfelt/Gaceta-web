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
    start: (artistSlugs = []) => call("start_round", { p_artists: artistSlugs }),
    // `attempt` = attempts the client has seen; lets the server ignore a retry
    // of an attempt it already recorded.
    guess: (roundId, trackId, attempt) =>
      call("guess_round", { p_round: roundId, p_track: trackId, p_attempt: attempt }),
    skip: (roundId, attempt) => call("skip_round", { p_round: roundId, p_attempt: attempt }),
  };
}
