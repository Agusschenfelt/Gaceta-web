/**
 * The round state, sealed in an opaque token. The server keeps nothing between
 * calls: the client holds the token and sends it back, and only this module can
 * read or forge one (AES-256-GCM: confidential and authenticated), so the
 * browser never learns which song is playing.
 *
 * Token = base64url(iv | ciphertext | tag). Anything that does not open
 * (garbled, tampered, sealed with another key, expired, wrong shape) is simply
 * "no such round": `openRound` returns null and the caller reports
 * `round_not_found`. A missing secret is a deployment mistake and throws.
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { Buffer } from "node:buffer";

export const TOKEN_VERSION = 1;
/** A round older than this is gone, finished or not. */
export const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

const IV_BYTES = 12;
const TAG_BYTES = 16;

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigError";
  }
}

function keyFrom(secret) {
  if (typeof secret !== "string" || secret.length === 0) {
    throw new ConfigError("ROUND_TOKEN_SECRET is not set");
  }
  return createHash("sha256").update(secret).digest();
}

/** Seals a round payload ({ id, trackId, level, stageIndex, attempts, status, createdAt }). */
export function sealRound(round, secret) {
  const key = keyFrom(secret);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const body = Buffer.from(JSON.stringify({ v: TOKEN_VERSION, ...round }), "utf8");
  const sealed = Buffer.concat([cipher.update(body), cipher.final()]);
  return Buffer.concat([iv, sealed, cipher.getAuthTag()]).toString("base64url");
}

function isShapedRound(p) {
  return (
    p !== null &&
    typeof p === "object" &&
    p.v === TOKEN_VERSION &&
    typeof p.id === "string" &&
    typeof p.trackId === "string" &&
    typeof p.level === "string" &&
    Number.isInteger(p.stageIndex) &&
    Array.isArray(p.attempts) &&
    typeof p.status === "string" &&
    Number.isFinite(p.createdAt)
  );
}

/** The round inside a token, or null for anything that is not a live, genuine one. */
export function openRound(token, secret, now = Date.now()) {
  const key = keyFrom(secret);
  if (typeof token !== "string" || token.length === 0 || token.length > 16384) return null;
  try {
    const raw = Buffer.from(token, "base64url");
    if (raw.length <= IV_BYTES + TAG_BYTES) return null;
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(raw.length - TAG_BYTES);
    const sealed = raw.subarray(IV_BYTES, raw.length - TAG_BYTES);
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const body = Buffer.concat([decipher.update(sealed), decipher.final()]);
    const round = JSON.parse(body.toString("utf8"));
    if (!isShapedRound(round)) return null;
    if (now - round.createdAt > TOKEN_TTL_MS) return null;
    const { v, ...rest } = round;
    return v === TOKEN_VERSION ? rest : null;
  } catch {
    return null;
  }
}
