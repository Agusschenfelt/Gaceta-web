/**
 * Where a round's audio and the waveform envelopes come from.
 *
 * With Supabase they live in its public Storage bucket `audio`, uploaded under
 * opaque names by `npm run upload-audio`: the sources are not in the (public)
 * repository, so a Vercel build has no audio to ship. Without Supabase (local
 * development) `npm run assets` serves them from public/.
 */
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const AUDIO_BASE = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/audio` : "/audio";

export const PEAKS_URL = SUPABASE_URL ? `${AUDIO_BASE}/peaks.json` : "/catalog/peaks.json";

export function audioUrl(audioKey) {
  return `${AUDIO_BASE}/${encodeURIComponent(audioKey)}.mp3`;
}
