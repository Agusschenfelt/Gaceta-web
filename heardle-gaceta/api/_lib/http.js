/**
 * HTTP edge of the round functions: body in, `{ round, token }` or
 * `{ error }` out. Everything that decides anything is in arbiter.js; this
 * file only parses, seals and maps errors to status codes.
 *
 * The response never carries the answer while a round is playing (the view
 * guarantees it) and is never cached.
 */
import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { ArbiterError } from "./arbiter.js";
import { readConfig } from "./config.js";
import { ConfigError, openRound, sealRound } from "./roundToken.js";
import { catalogPool } from "./trackPool.js";

export const MAX_BODY_BYTES = 8 * 1024;

const STATUS_OF = {
  invalid_request: 400,
  invalid_level: 400,
  invalid_filter: 400,
  invalid_attempt: 400,
  unknown_track: 400,
  empty_pool: 400,
  round_not_found: 404,
  method_not_allowed: 405,
  payload_too_large: 413,
  unexpected: 500,
};

const HEADERS = { "Cache-Control": "no-store" };

function fail(code) {
  return Response.json({ error: code }, { status: STATUS_OF[code] ?? 500, headers: HEADERS });
}

/** The JSON object in the request body, or an ArbiterError-style failure. */
async function readBody(request) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new ArbiterError("payload_too_large");
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > MAX_BODY_BYTES) throw new ArbiterError("payload_too_large");
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new ArbiterError("invalid_request");
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new ArbiterError("invalid_request");
  }
  return body;
}

/**
 * Builds a Vercel Function (`export default { fetch }`) for one round action.
 * `run(body, round, deps)` returns the arbiter result; `env`, `pool`, `now`,
 * `random` and `newId` are injectable for tests.
 */
export function roundEndpoint(run, overrides = {}) {
  return {
    async fetch(request) {
      if (request.method !== "POST") return fail("method_not_allowed");
      try {
        const config = (overrides.readConfig ?? readConfig)();
        const body = await readBody(request);
        const now = overrides.now ?? Date.now;
        const round = openRound(body.token, config.tokenSecret, now());
        const deps = {
          pool: overrides.pool ?? catalogPool,
          audioKeyFor: config.audioKeyFor,
          random: overrides.random ?? Math.random,
          now,
          newId: overrides.newId ?? randomUUID,
        };
        const result = run(body, round, deps);
        // A replay hands back the token it came with; a changed round gets a fresh one.
        const token = result.changed ? sealRound(result.state, config.tokenSecret) : body.token;
        return Response.json({ round: result.view, token }, { headers: HEADERS });
      } catch (error) {
        if (error instanceof ArbiterError) return fail(error.code);
        // Config mistakes and bugs: log for the operator, tell the client nothing.
        console.error("rounds: unexpected failure", error instanceof ConfigError ? error.message : error);
        return fail("unexpected");
      }
    },
  };
}
