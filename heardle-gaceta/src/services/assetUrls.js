/**
 * Where a round's audio and the waveform envelopes come from.
 *
 * - Rounds API (VITE_ROUNDS_API=true): the public Vercel Blob store, under
 *   VITE_AUDIO_BASE_URL, uploaded with opaque names by `npm run upload-audio`.
 *   The sources are not in the (public) repository, so a Vercel build has no
 *   audio to ship.
 * - Supabase: its public Storage bucket `audio` (removed with Supabase).
 * - Otherwise (local development): `npm run assets` serves them from public/.
 *
 * API mode without VITE_AUDIO_BASE_URL falls back to the local paths, which
 * would 404 in production, so it warns once instead of failing silently.
 */

/** Pure: resolves the URLs from an env object and an optional warn callback. */
export function resolveAssetUrls(env, warn = () => {}) {
  const trim = (s) => String(s ?? "").trim().replace(/\/+$/, "");
  let base = "/audio";
  let peaks = "/catalog/peaks.json";

  if (env.VITE_ROUNDS_API === "true") {
    const blob = trim(env.VITE_AUDIO_BASE_URL);
    if (blob) {
      base = blob;
      peaks = `${blob}/peaks.json`;
    } else {
      warn("VITE_AUDIO_BASE_URL is not set: falling back to local /audio, which only exists in development");
    }
  } else if (env.VITE_SUPABASE_URL) {
    base = `${env.VITE_SUPABASE_URL}/storage/v1/object/public/audio`;
    peaks = `${base}/peaks.json`;
  }

  return { peaksUrl: peaks, audioUrl: (key) => `${base}/${encodeURIComponent(key)}.mp3` };
}

const urls = resolveAssetUrls(import.meta.env, (m) => console.warn(m));

export const PEAKS_URL = urls.peaksUrl;
export const audioUrl = urls.audioUrl;
