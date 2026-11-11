import { DEFAULT_LEVEL } from "../game/engine.js";
import { readRecent, recordRecent } from "../catalog/recentTracks.js";
import { RoundError, fromApiError } from "./roundErrors.js";

const ROUND_KEY = "heardle:api:round";

/**
 * Rounds dealt and judged by the Vercel Functions in api/rounds. The server
 * keeps nothing: it hands back a sealed token with every round and the browser
 * keeps the current one, so a reload resumes the open round. The token is
 * opaque here; the answer only arrives once the round is over.
 *
 * `fetch` and `storage` are injected for tests.
 */
export function createApiRounds({
  fetch = globalThis.fetch?.bind(globalThis),
  storage = globalThis.localStorage,
  baseUrl = "",
} = {}) {
  function readOpen() {
    try {
      const open = JSON.parse(storage.getItem(ROUND_KEY) ?? "null");
      return open && typeof open.id === "string" && typeof open.token === "string" ? open : null;
    } catch {
      return null;
    }
  }

  function writeOpen(open) {
    try {
      if (open) storage.setItem(ROUND_KEY, JSON.stringify(open));
      else storage.removeItem(ROUND_KEY);
    } catch {
      /* storage unavailable: the round just will not survive a reload */
    }
  }

  async function post(path, body) {
    let response;
    let data;
    try {
      response = await fetch(`${baseUrl}/api/rounds/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      data = await response.json();
    } catch (cause) {
      // A dropped request, or an answer that is not ours (gateway error page):
      // worth retrying, unlike a refusal.
      throw new RoundError("network", cause);
    }
    if (!response.ok || data?.error) {
      const error = fromApiError(data?.error);
      // The server no longer recognises the stored token: drop it so the next
      // start deals a fresh round instead of resending a dead one.
      if (error.code === "round_not_found") writeOpen(null);
      throw error;
    }
    if (!data?.round || typeof data.token !== "string") throw new RoundError("unexpected");
    return data;
  }

  /** Remembers the round to resume, or the answer to avoid once it is over. */
  function settle({ round, token }) {
    if (round.status === "playing") {
      writeOpen({ id: round.id, token });
    } else {
      writeOpen(null);
      if (round.answerId) recordRecent(round.answerId, storage);
    }
    return round;
  }

  async function act(path, roundId, body) {
    const open = readOpen();
    if (!open || open.id !== roundId) throw new RoundError("round_not_found");
    return settle(await post(path, { token: open.token, ...body }));
  }

  return {
    mode: "api",
    // The level and filter only apply to a round dealt now; an open one is resumed.
    start: async (artistSlugs = [], level = DEFAULT_LEVEL) =>
      settle(
        await post("start", {
          token: readOpen()?.token,
          artists: artistSlugs,
          level,
          exclude: readRecent(storage),
        })
      ),
    // `attempt` = attempts the client has seen; lets the server ignore a retry.
    guess: (roundId, trackId, attempt) => act("guess", roundId, { trackId, attempt }),
    skip: (roundId, attempt) => act("skip", roundId, { attempt }),
  };
}
