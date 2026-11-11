import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import start from "../rounds/start.js";
import guess from "../rounds/guess.js";
import skip from "../rounds/skip.js";
import { MAX_BODY_BYTES } from "./http.js";
import { openRound } from "./roundToken.js";
import { catalogPool } from "./trackPool.js";

const SECRET = "route-test-secret";

beforeEach(() => {
  vi.stubEnv("ROUND_TOKEN_SECRET", SECRET);
  vi.stubEnv("AUDIO_KEY_SECRET", "audio-test-secret");
  vi.stubEnv("VERCEL_ENV", "");
});
afterEach(() => vi.unstubAllEnvs());

const post = (route, body, init = {}) =>
  route.fetch(
    new Request("https://example.test/api/rounds/x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
      ...init,
    }),
  );

const wrongTrackId = (trackId) => catalogPool.tracks.find((t) => t.id !== trackId).id;

describe("POST /api/rounds/start", () => {
  it("deals a round and a token, without the answer, uncached", async () => {
    const res = await post(start, { artists: ["dazen"], level: "hard", exclude: [] });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const { round, token } = await res.json();
    expect(round.status).toBe("playing");
    expect(round.level).toBe("hard");
    expect(round.answerId).toBeNull();
    expect(round.answer).toBeNull();
    const state = openRound(token, SECRET);
    expect(round.audioKey).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect(round.audioKey).not.toBe(state.trackId);
    expect(JSON.stringify(round)).not.toContain(state.trackId);
    expect(catalogPool.byId.get(state.trackId).artistSlugs).toContain("dazen");
  });

  it("resumes the open round from its token, with the same token", async () => {
    const first = await (await post(start, { level: "normal" })).json();
    const again = await post(start, { token: first.token, level: "hard", artists: ["ramma"] });
    const body = await again.json();
    expect(body.round.id).toBe(first.round.id);
    expect(body.round.level).toBe("normal");
    expect(body.token).toBe(first.token);
  });

  it("treats an empty body object as defaults", async () => {
    const res = await post(start, {});
    expect(res.status).toBe(200);
    expect((await res.json()).round.level).toBe("normal");
  });

  it("maps arbiter errors to a code and a 400", async () => {
    let res = await post(start, { level: "easy" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_level" });
    res = await post(start, { artists: ["nobody"] });
    expect(await res.json()).toEqual({ error: "empty_pool" });
    res = await post(start, { artists: ["x".repeat(65)] });
    expect(await res.json()).toEqual({ error: "invalid_filter" });
  });

  it("answers 405 to anything but POST", async () => {
    const res = await start.fetch(new Request("https://example.test/api/rounds/start"));
    expect(res.status).toBe(405);
    expect(await res.json()).toEqual({ error: "method_not_allowed" });
  });

  it("rejects malformed and oversized bodies", async () => {
    let res = await post(start, "{nope");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_request" });
    res = await post(start, "[1]");
    expect(res.status).toBe(400);
    res = await post(start, { pad: "x".repeat(MAX_BODY_BYTES) });
    expect(res.status).toBe(413);
    expect(await res.json()).toEqual({ error: "payload_too_large" });
  });

  it("answers 500 `unexpected` and leaks nothing when a secret is missing", async () => {
    vi.stubEnv("ROUND_TOKEN_SECRET", "");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(start, {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "unexpected" });
    expect(log).toHaveBeenCalled();
    log.mockRestore();
  });

  it("answers 500 when deployed without AUDIO_KEY_SECRET", async () => {
    vi.stubEnv("AUDIO_KEY_SECRET", "");
    vi.stubEnv("VERCEL_ENV", "production");
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(start, {});
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "unexpected" });
    log.mockRestore();
  });
});

describe("POST /api/rounds/guess", () => {
  it("records a wrong guess with a fresh token, then replays it with the same one", async () => {
    const { token } = await (await post(start, {})).json();
    const trackId = openRound(token, SECRET).trackId;
    const wrong = wrongTrackId(trackId);

    const res = await post(guess, { token, trackId: wrong, attempt: 0 });
    expect(res.status).toBe(200);
    const next = await res.json();
    expect(next.round.stageIndex).toBe(1);
    expect(next.round.attempts).toEqual([{ type: "guess", trackId: wrong, correct: false }]);
    expect(next.token).not.toBe(token);

    const replay = await (await post(guess, { token: next.token, trackId: wrong, attempt: 0 })).json();
    expect(replay.round.attempts).toHaveLength(1);
    expect(replay.token).toBe(next.token);
  });

  it("wins with the right track and reveals the answer", async () => {
    const { token } = await (await post(start, { artists: ["lonzo"] })).json();
    const trackId = openRound(token, SECRET).trackId;
    const win = await (await post(guess, { token, trackId, attempt: 0 })).json();
    expect(win.round.status).toBe("won");
    expect(win.round.score).toBe(4);
    expect(win.round.answerId).toBe(trackId);
    expect(win.round.answer.title).toBe(catalogPool.byId.get(trackId).title);
  });

  it("answers 404 round_not_found for a missing, forged or foreign token", async () => {
    for (const token of [undefined, "forged", 5]) {
      const res = await post(guess, { token, trackId: "x", attempt: 0 });
      expect(res.status).toBe(404);
      expect(await res.json()).toEqual({ error: "round_not_found" });
    }
    const { token } = await (await post(start, {})).json();
    vi.stubEnv("ROUND_TOKEN_SECRET", "another-secret");
    const res = await post(guess, { token, trackId: "x", attempt: 0 });
    expect(res.status).toBe(404);
  });

  it("answers 400 for an unknown track and for a bad attempt count", async () => {
    const { token } = await (await post(start, {})).json();
    let res = await post(guess, { token, trackId: "NOPE", attempt: 0 });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "unknown_track" });
    res = await post(guess, { token, trackId: wrongTrackId(openRound(token, SECRET).trackId) });
    expect(await res.json()).toEqual({ error: "invalid_attempt" });
  });
});

describe("POST /api/rounds/skip", () => {
  it("skips to the next stage and loses after four misses", async () => {
    let { token, round } = await (await post(start, { level: "normal" })).json();
    const trackId = openRound(token, SECRET).trackId;
    for (let n = 0; n < 3; n += 1) {
      ({ token, round } = await (await post(skip, { token, attempt: n })).json());
      expect(round.stageIndex).toBe(n + 1);
      expect(round.answerId).toBeNull();
    }
    ({ round } = await (await post(skip, { token, attempt: 3 })).json());
    expect(round.status).toBe("lost");
    expect(round.score).toBe(0);
    expect(round.answerId).toBe(trackId);
  });

  it("answers 404 without a token and 400 without an attempt", async () => {
    expect((await post(skip, { attempt: 0 })).status).toBe(404);
    const { token } = await (await post(start, {})).json();
    const res = await post(skip, { token });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid_attempt" });
  });
});
