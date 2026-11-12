/**
 * The opaque name of a track's audio. One definition, imported by the publish
 * script (which names the files) and by the round arbiter in api/ (which tells
 * the player which file to fetch), so the two can never drift apart.
 */
import { createHmac } from "node:crypto";

/**
 * HMAC rather than a plain hash: a plain hash of a public ISRC can be
 * recomputed by anyone, a keyed one cannot.
 *
 * Without a secret the key is the ISRC itself. That is only acceptable for
 * local development, which `assertSafeConfig` (and api/_lib/config.js) enforce.
 */
export function audioKey(isrc, secret) {
  if (!secret) return isrc;
  return createHmac("sha256", secret).update(isrc).digest("base64url").slice(0, 22);
}
