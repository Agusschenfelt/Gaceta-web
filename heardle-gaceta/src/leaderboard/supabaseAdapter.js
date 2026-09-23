import { toRoundError } from "../rounds/roundErrors.js";

/**
 * The board over Supabase. Every call is a function in supabase/schema.sql
 * acting as the signed-in (anonymous) player: no table is readable directly,
 * and nothing here can name another player.
 */
export function createSupabaseAdapter(client) {
  async function call(fn, args) {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw toRoundError(error);
    return data;
  }

  return {
    name: "supabase",

    async getTop(limit = 20) {
      const rows = await call("get_leaderboard", { p_limit: limit });
      return (rows ?? []).map((r) => ({
        alias: r.alias,
        gamesPlayed: r.games_played,
        totalScore: r.total_score,
        avgScore: Number(r.avg_score),
      }));
    },

    async getPlayerStats() {
      const s = await call("my_stats");
      return {
        alias: s?.alias ?? null,
        gamesPlayed: s?.gamesPlayed ?? 0,
        totalScore: s?.totalScore ?? 0,
        avgScore: Number(s?.avgScore ?? 0),
      };
    },

    /** Returns the alias as the database stored it (trimmed, spaces collapsed). */
    setAlias: (alias) => call("set_alias", { p_alias: alias }),

    subscribeEmail: (email) => call("subscribe_email", { p_email: email }),
  };
}
