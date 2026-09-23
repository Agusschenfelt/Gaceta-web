import { createClient } from "@supabase/supabase-js";
import { createSupabaseRounds } from "../rounds/supabaseRounds.js";
import { createSupabaseAdapter } from "../leaderboard/supabaseAdapter.js";
import { RoundError } from "../rounds/roundErrors.js";
import { isDeadSession } from "./session.js";

/**
 * One Supabase client, signed in anonymously. The session is kept in
 * localStorage under its own key, so the same browser stays the same player
 * across visits; that identity is signed by Supabase, not made up by the page.
 *
 * A stored session can outlive its user (anonymous users get cleaned up). It
 * is checked against the server once on start; a dead one is dropped and a
 * fresh anonymous sign-in takes its place. A network error is not a dead
 * session: that keeps the identity and lets the game report the connection.
 */
export async function createSupabaseServices({ url, anonKey }) {
  const client = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "heardle:auth" },
  });

  const { data } = await client.auth.getSession();
  let signedIn = Boolean(data.session);
  if (signedIn) {
    const { error } = await client.auth.getUser();
    if (isDeadSession(error)) {
      await client.auth.signOut({ scope: "local" });
      signedIn = false;
    }
  }
  if (!signedIn) {
    const { error } = await client.auth.signInAnonymously();
    if (error) throw new RoundError("not_authenticated", error);
  }

  return {
    rounds: createSupabaseRounds(client),
    board: createSupabaseAdapter(client),
  };
}
