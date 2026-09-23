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
    guess: (roundId, trackId) => call("guess_round", { p_round: roundId, p_track: trackId }),
    skip: (roundId) => call("skip_round", { p_round: roundId }),
  };
}
