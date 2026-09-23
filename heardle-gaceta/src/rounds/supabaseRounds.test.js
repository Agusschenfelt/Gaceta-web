import { describe, it, expect, vi } from "vitest";
import { createSupabaseRounds } from "./supabaseRounds.js";
import { toRoundError, RoundError } from "./roundErrors.js";

const fakeClient = (result) => ({ rpc: vi.fn(async () => result) });

describe("supabaseRounds", () => {
  it("calls the database functions with their parameter names", async () => {
    const client = fakeClient({ data: { id: "r1" }, error: null });
    const rounds = createSupabaseRounds(client);
    await rounds.start(["ramma"]);
    await rounds.guess("r1", "ISRC", 2);
    await rounds.skip("r1", 3);
    expect(client.rpc.mock.calls).toEqual([
      ["start_round", { p_artists: ["ramma"] }],
      ["guess_round", { p_round: "r1", p_track: "ISRC", p_attempt: 2 }],
      ["skip_round", { p_round: "r1", p_attempt: 3 }],
    ]);
  });

  it("turns a database exception into a coded error", async () => {
    const rounds = createSupabaseRounds(fakeClient({ data: null, error: { message: "rate_limited" } }));
    await expect(rounds.start()).rejects.toMatchObject({ code: "rate_limited" });
  });
});

describe("toRoundError", () => {
  it("falls back to a connection error for anything unknown", () => {
    const e = toRoundError(new TypeError("Failed to fetch"));
    expect(e).toBeInstanceOf(RoundError);
    expect(e.code).toBe("network");
    expect(e.message).toMatch(/conectar/);
  });

  it("passes a RoundError through untouched", () => {
    const e = new RoundError("alias_taken");
    expect(toRoundError(e)).toBe(e);
  });
});
