import { beforeEach, describe, expect, it, vi } from "vitest";
import { createApiRounds } from "./apiRounds.js";
import { RoundError } from "./roundErrors.js";
import { installLocalStorage } from "../test-utils/localStorage.js";

const playing = (id = "r1", extra = {}) => ({
  id,
  audioKey: "k",
  stages: [1, 2, 4, 8],
  level: "normal",
  stageIndex: 0,
  attempts: [],
  status: "playing",
  score: 0,
  answerId: null,
  answer: null,
  ...extra,
});
const over = (id = "r1", answerId = "ISRC1") =>
  playing(id, { status: "won", answerId, answer: { id: answerId, title: "T", artistSlugs: [] } });

const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });
const sentBody = (fetch, n = 0) => JSON.parse(fetch.mock.calls[n][1].body);

let storage;
beforeEach(() => {
  storage = installLocalStorage();
});

function setup(...responses) {
  const fetch = vi.fn();
  for (const r of responses) fetch.mockImplementationOnce(async () => r);
  return { fetch, rounds: createApiRounds({ fetch, storage }) };
}

describe("apiRounds", () => {
  it("starts without a token and sends the filter, level and recent exclusions", async () => {
    storage.setItem("heardle:recent", JSON.stringify(["A", "B"]));
    const { fetch, rounds } = setup(reply({ round: playing(), token: "t1" }));
    const round = await rounds.start(["ramma"], "hard");
    expect(round.id).toBe("r1");
    expect(fetch.mock.calls[0][0]).toBe("/api/rounds/start");
    expect(sentBody(fetch)).toEqual({ artists: ["ramma"], level: "hard", exclude: ["A", "B"] });
  });

  it("stores the returned token and sends it on the next start to resume", async () => {
    const { fetch, rounds } = setup(
      reply({ round: playing(), token: "t1" }),
      reply({ round: playing(), token: "t1" })
    );
    await rounds.start();
    expect(JSON.parse(storage.getItem("heardle:api:round"))).toEqual({ id: "r1", token: "t1" });
    await rounds.start();
    expect(sentBody(fetch, 1).token).toBe("t1");
  });

  it("sends the stored token and attempt on guess and skip, and keeps the newest token", async () => {
    const { fetch, rounds } = setup(
      reply({ round: playing(), token: "t1" }),
      reply({ round: playing("r1", { stageIndex: 1 }), token: "t2" }),
      reply({ round: playing("r1", { stageIndex: 2 }), token: "t3" })
    );
    await rounds.start();
    await rounds.guess("r1", "ISRC9", 0);
    expect(fetch.mock.calls[1][0]).toBe("/api/rounds/guess");
    expect(sentBody(fetch, 1)).toEqual({ token: "t1", trackId: "ISRC9", attempt: 0 });
    await rounds.skip("r1", 1);
    expect(fetch.mock.calls[2][0]).toBe("/api/rounds/skip");
    expect(sentBody(fetch, 2)).toEqual({ token: "t2", attempt: 1 });
  });

  it("rejects an action for a round it does not hold without calling the server", async () => {
    const { fetch, rounds } = setup(reply({ round: playing(), token: "t1" }));
    await expect(rounds.guess("r1", "X", 0)).rejects.toMatchObject({ code: "round_not_found" });
    await rounds.start();
    await expect(rounds.skip("other", 0)).rejects.toMatchObject({ code: "round_not_found" });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("records the answer as recent and drops the token when the round ends", async () => {
    storage.setItem("heardle:recent", JSON.stringify(["A"]));
    const { fetch, rounds } = setup(
      reply({ round: playing(), token: "t1" }),
      reply({ round: over(), token: "t2" }),
      reply({ round: playing("r2"), token: "t3" })
    );
    await rounds.start();
    const finished = await rounds.guess("r1", "ISRC1", 0);
    expect(finished.answerId).toBe("ISRC1");
    expect(storage.getItem("heardle:api:round")).toBeNull();
    expect(JSON.parse(storage.getItem("heardle:recent"))).toEqual(["A", "ISRC1"]);
    await rounds.start();
    expect(sentBody(fetch, 2).token).toBeUndefined();
    expect(sentBody(fetch, 2).exclude).toEqual(["A", "ISRC1"]);
  });

  it("does not list the same answer twice when a finished round is replayed", async () => {
    const { rounds } = setup(
      reply({ round: playing(), token: "t1" }),
      reply({ round: over(), token: "t2" })
    );
    await rounds.start();
    await rounds.guess("r1", "ISRC1", 0);
    // replay: the round is no longer held, but a late start response may repeat it
    const again = setup(reply({ round: over(), token: "t2" }));
    await again.rounds.start();
    expect(JSON.parse(storage.getItem("heardle:recent"))).toEqual(["ISRC1"]);
  });

  it("keeps working when storage is unavailable", async () => {
    const broken = {
      getItem: () => {
        throw new Error("off");
      },
      setItem: () => {
        throw new Error("off");
      },
      removeItem: () => {
        throw new Error("off");
      },
    };
    const fetch = vi.fn(async () => reply({ round: playing(), token: "t1" }));
    const round = await createApiRounds({ fetch, storage: broken }).start();
    expect(round.id).toBe("r1");
  });

  it("prefixes requests with baseUrl", async () => {
    const fetch = vi.fn(async () => reply({ round: playing(), token: "t" }));
    await createApiRounds({ fetch, storage, baseUrl: "https://x.test" }).start();
    expect(fetch.mock.calls[0][0]).toBe("https://x.test/api/rounds/start");
  });
});

describe("apiRounds errors", () => {
  it("maps the server's codes", async () => {
    for (const code of ["empty_pool", "invalid_level", "invalid_filter", "unknown_track", "round_not_found"]) {
      const { rounds } = setup(reply({ error: code }, 400));
      await expect(rounds.start()).rejects.toMatchObject({ name: "RoundError", code });
    }
  });

  it("turns the API-only codes into unexpected", async () => {
    for (const code of ["invalid_request", "payload_too_large", "method_not_allowed", "unexpected", "weird"]) {
      const { rounds } = setup(reply({ error: code }, 500));
      await expect(rounds.start()).rejects.toMatchObject({ code: "unexpected" });
    }
  });

  it("treats a failed request as a retryable network error", async () => {
    const fetch = vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    });
    const error = await createApiRounds({ fetch, storage }).start().catch((e) => e);
    expect(error).toBeInstanceOf(RoundError);
    expect(error.code).toBe("network");
  });

  it("treats a non-JSON answer (gateway page) as a network error", async () => {
    const { rounds } = setup({
      ok: false,
      status: 502,
      json: async () => {
        throw new SyntaxError("Unexpected token <");
      },
    });
    await expect(rounds.start()).rejects.toMatchObject({ code: "network" });
  });

  it("treats a success body without a round as unexpected", async () => {
    const { rounds } = setup(reply({ nope: true }));
    await expect(rounds.start()).rejects.toMatchObject({ code: "unexpected" });
  });
});
