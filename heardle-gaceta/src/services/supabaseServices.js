import { createClient } from "@supabase/supabase-js";
import { createSupabaseRounds } from "../rounds/supabaseRounds.js";
import { createSupabaseAdapter } from "../leaderboard/supabaseAdapter.js";
import { RoundError } from "../rounds/roundErrors.js";

/**
 * One Supabase client, signed in anonymously. The session is kept in
 * localStorage under its own key, so the same browser stays the same player
 * across visits; that identity is signed by Supabase, not made up by the page.
 */
export async function createSupabaseServices({ url, anonKey }) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "heardle:auth" },
  });

  const { data } = await client.auth.getSession();
  if (!data.session) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw new RoundError("not_authenticated", error);
  }

  return {
    rounds: createSupabaseRounds(client),
    board: createSupabaseAdapter(client),
  };
}
