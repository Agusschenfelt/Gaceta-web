/**
 * Pure decision helpers for scripts/upload-audio.mjs.
 *
 * peaks.json has one fixed pathname in the Blob store (audio/peaks.json) and is keyed by audio
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

/** Names (relative to the audio/ prefix) on the store that are not part of this publish's audio files. */
export function staleAudioNames(remoteNames, publishedAudioNames, peaksName = "peaks.json") {
  return remoteNames.filter((name) => name !== peaksName && !publishedAudioNames.has(name));
}

/** Whether this run may (re-)publish peaks.json. */
export function shouldUploadPeaks({ prune, staleAudioCount }) {
  return Boolean(prune) || staleAudioCount === 0;
}

/** Every object lives under this prefix in the Blob store. */
export const BLOB_PREFIX = "audio/";

/** Blob pathname for a published file name. */
export function blobPathname(name) {
  return `${BLOB_PREFIX}${name}`;
}

/** Store pathnames → names relative to the prefix; anything outside the prefix is ignored. */
export function namesFromPathnames(pathnames) {
  return pathnames.filter((p) => p.startsWith(BLOB_PREFIX)).map((p) => p.slice(BLOB_PREFIX.length));
}

/**
 * Whether a file must be (re)uploaded. Blob exposes no content hash we can
 * compare with, so the rule is: same pathname and same byte size = unchanged.
 * That is sound for mp3s because their names are HMAC(secret, ISRC): a new
 * name means a new object, and re-encoding the same track with different
 * settings changes the size. A same-size content change (rare) needs --force.
 * peaks.json is always uploaded by the caller: it is tiny and its content can
 * change without its size changing.
 */
export function needsUpload({ localSize, remoteSize, force }) {
  return Boolean(force) || remoteSize === undefined || remoteSize !== localSize;
}
