/**
 * Pure helpers for publish-assets.mjs: everything that decides what the
 * browser is allowed to see, kept apart from the file system so it can be
 * tested.
 *
 * The rule: the browser may know every track (it needs them for the search)
 * and it may download the audio of the round it is playing, but it must never
 * be able to connect one to the other. That link is the answer.
 */

// Defined in audioKey.mjs so api/ shares it; re-exported for existing callers.
export { audioKey } from "./audioKey.mjs";

/**
 * Refuses a configuration that would ship the answer: a production build, or
 * or any build talking to the rounds API, needs the secret. Local-only
 * development may run without it.
 */
export function assertSafeConfig({ secret, env }) {
  // A deployed build in API mode with no audio base would ship URLs that 404.
  const deployed = Boolean(env.VERCEL_ENV) && env.VERCEL_ENV !== "development";
  if (deployed && env.VITE_ROUNDS_API === "true" && !String(env.VITE_AUDIO_BASE_URL ?? "").trim()) {
    throw new Error("VITE_AUDIO_BASE_URL is required for a deployed build with the rounds API enabled");
  }
  if (secret) return;
  if (env.VERCEL_ENV === "production") {
    throw new Error("AUDIO_KEY_SECRET is required for a production build");
  }
  if (env.VITE_ROUNDS_API === "true") {
    throw new Error("AUDIO_KEY_SECRET is required when the rounds API is enabled");
  }
}

/**
 * The track as the browser gets it. No audio path, ever. The audio key is only
 * included when there is no secret (local mode picks rounds in the browser and
 * needs it); with a secret the server hands it out one round at a time.
 */
export function publicTrack(track, key, { exposeKey }) {
  const { audio_file, deezer_id, ...rest } = track;
  return exposeKey && key ? { ...rest, audio_key: key } : rest;
}

/** Envelopes re-keyed from ISRC to audio key, dropping any without audio. */
export function rekeyPeaks(peaks, keyFor) {
  const out = {};
  for (const [isrc, values] of Object.entries(peaks)) {
    const key = keyFor(isrc);
    if (key) out[key] = values;
  }
  return out;
}
