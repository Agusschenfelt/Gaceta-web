import { createClient } from "@supabase/supabase-js";
import { createSupabaseRounds } from "../rounds/supabaseRounds.js";
import { createSupabaseAdapter } from "../leaderboard/supabaseAdapter.js";
import { RoundError } from "../rounds/roundErrors.js";
import { isDeadSession } from "./session.js";
import { getCaptchaToken } from "./captcha.js";

/**
 * One Supabase client, signed in anonymously. The session is kept in
 * localStorage under its own key, so the same browser stays the same player
 * across visits; that identity is signed by Supabase, not made up by the page.
 *
 * A stored session can outlive its user (anonymous users get cleaned up). It
 * is checked against the server once on start; a dead one is dropped and a
 * fresh anonymous sign-in takes its place. A network error is not a dead
 * session: that keeps the identity and lets the game report the connection.
 *
 * Only a brand-new anonymous sign-in fetches a Turnstile token: an existing
 * or refreshed session never runs the captcha. `createSupabaseServices` runs
 * again from scratch on every retry (see GameContainer's login effect), so a
 * fresh token is fetched each time — required, since a Turnstile token is
 * single-use. Supabase ignores `captchaToken` until "CAPTCHA protection" is
 * enabled in its dashboard; until then this is a no-op there.
 */
export async function createSupabaseServices({ url, anonKey, turnstileSiteKey }) {
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
    let captchaToken;
    try {
      captchaToken = await getCaptchaToken(turnstileSiteKey);
    } catch (error) {
      throw new RoundError("not_authenticated", error);
    }
    const { error } = await client.auth.signInAnonymously(
      captchaToken ? { options: { captchaToken } } : undefined
    );
    if (error) throw new RoundError("not_authenticated", error);
  }

  return {
    rounds: createSupabaseRounds(client),
    board: createSupabaseAdapter(client),
  };
}
