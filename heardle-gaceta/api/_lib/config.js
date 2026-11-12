/**
 * The only place the round functions read the environment. A missing secret is
 * a deployment mistake: it throws a ConfigError (the endpoint answers 500 and
 * logs it) instead of falling back to something guessable.
 */
import process from "node:process";
import { audioKey } from "../../scripts/lib/audioKey.mjs";
import { ConfigError } from "./roundToken.js";

export function readConfig(env = process.env) {
  const tokenSecret = env.ROUND_TOKEN_SECRET;
  if (!tokenSecret) throw new ConfigError("ROUND_TOKEN_SECRET is not set");

  const audioSecret = env.AUDIO_KEY_SECRET ?? "";
  // Without a secret the audio key is the ISRC, i.e. the answer. That is only
  // tolerable off Vercel (local development); any deployed environment refuses.
  if (!audioSecret && env.VERCEL_ENV && env.VERCEL_ENV !== "development") {
    throw new ConfigError("AUDIO_KEY_SECRET is required in a deployed environment");
  }

  return {
    tokenSecret,
    audioKeyFor: (isrc) => audioKey(isrc, audioSecret),
  };
}
