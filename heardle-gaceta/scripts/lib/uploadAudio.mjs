/**
 * Pure decision helpers for scripts/upload-audio.mjs.
 *
 * peaks.json has one fixed name in the Storage bucket and is keyed by audio
 * key. A secret rotation (or, more rarely, a plain catalog change that
 * dropped a track) can leave old audio keys published alongside the new
 * ones, still un-pruned, while the DB seed has not switched over yet. In
 * that window, in-flight rounds still resolve those old keys: overwriting
 * peaks.json with data re-keyed for the new set would drop the entries they
 * need, going flat for them (loadPeaks never rejects, it resolves to {}) with
 * no way back until the next publish. Safe once nothing stale remains, or
 * once --prune says the new seed is already live and the old keys are being
 * removed in this same run.
 */

/** Names on Storage that are not part of this publish's audio files. */
export function staleAudioNames(remoteNames, publishedAudioNames, peaksName = "peaks.json") {
  return remoteNames.filter((name) => name !== peaksName && !publishedAudioNames.has(name));
}

/** Whether this run may (re-)publish peaks.json. */
export function shouldUploadPeaks({ prune, staleAudioCount }) {
  return Boolean(prune) || staleAudioCount === 0;
}
