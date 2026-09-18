import { createClient } from "@supabase/supabase-js";

/** Supabase adapter. Schema lives in supabase/schema.sql. */
export function createSupabaseAdapter({ url, anonKey }) {
  const client = createClient(url, anonKey, { auth: { persistSession: false } });

  async function ensurePlayer(playerId) {
    const { error } = await client
      .from("players")
      .upsert({ id: playerId }, { onConflict: "id", ignoreDuplicates: true });
    if (error) throw error;
  }

  return {
    name: "supabase",

    async submitGame(game) {
      await ensurePlayer(game.playerId);
      const { error } = await client.from("games").insert({
        player_id: game.playerId,
        track_id: game.trackId,
        won: game.won,
        stage_won: game.stageWon,
        attempts: game.attempts,
        score: game.score,
      });
      if (error) throw error;
    },

    async setAlias(playerId, alias) {
      await ensurePlayer(playerId);
      const { error } = await client.from("players").update({ alias }).eq("id", playerId);
      if (error) throw error;
    },

    async getTop(limit = 20) {
      const { data, error } = await client
        .from("leaderboard")
        .select("alias, games_played, total_score, avg_score")
        .order("total_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []).map((r) => ({
        alias: r.alias,
        gamesPlayed: r.games_played,
        totalScore: r.total_score,
        avgScore: Number(r.avg_score),
      }));
    },

    async subscribeEmail(email, playerId) {
      const { error } = await client
        .from("emails")
        .upsert({ email, player_id: playerId }, { onConflict: "email", ignoreDuplicates: true });
      if (error) throw error;
    },
  };
}
