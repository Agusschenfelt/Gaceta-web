import { toRoundError } from "../rounds/roundErrors.js";

/**
 * The board over Supabase. The only call left is the email opt-in; it still
 * goes through a `security definer` function in supabase/schema.sql like every
 * other write, acting as the signed-in (anonymous) player.
 */
export function createSupabaseAdapter(client) {
  async function call(fn, args) {
    const { data, error } = await client.rpc(fn, args);
    if (error) throw toRoundError(error);
    return data;
  }

  return {
    name: "supabase",

    subscribeEmail: (email) => call("subscribe_email", { p_email: email }),
  };
}
