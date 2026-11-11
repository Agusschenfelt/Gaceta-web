import { describe, it, expect } from "vitest";
import { Buffer } from "node:buffer";
import { ConfigError, TOKEN_TTL_MS, openRound, sealRound } from "./roundToken.js";

const SECRET = "test-secret";
const NOW = 1_700_000_000_000;
const round = {
  id: "11111111-1111-1111-1111-111111111111",
  trackId: "T1",
  level: "normal",
  stageIndex: 1,
  attempts: [{ type: "skip" }],
  status: "playing",
  createdAt: NOW,
};

describe("round token", () => {
  it("round-trips a round", () => {
    expect(openRound(sealRound(round, SECRET), SECRET, NOW)).toEqual(round);
  });

  it("is opaque: the track id is not readable in the token", () => {
    const token = sealRound({ ...round, trackId: "UYT142400046" }, SECRET);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(Buffer.from(token, "base64url").toString("latin1")).not.toContain("UYT142400046");
  });

  it("seals the same round differently each time", () => {
    expect(sealRound(round, SECRET)).not.toBe(sealRound(round, SECRET));
  });

  it("rejects a tampered token", () => {
    const raw = Buffer.from(sealRound(round, SECRET), "base64url");
    raw[20] ^= 1;
    expect(openRound(raw.toString("base64url"), SECRET, NOW)).toBeNull();
  });

  it("rejects a truncated or garbled token", () => {
    const token = sealRound(round, SECRET);
    expect(openRound(token.slice(0, -4), SECRET, NOW)).toBeNull();
    expect(openRound("not a token at all!", SECRET, NOW)).toBeNull();
    expect(openRound("", SECRET, NOW)).toBeNull();
    expect(openRound(undefined, SECRET, NOW)).toBeNull();
    expect(openRound({ token: 1 }, SECRET, NOW)).toBeNull();
  });

  it("rejects a token sealed with another key", () => {
    expect(openRound(sealRound(round, "other-secret"), SECRET, NOW)).toBeNull();
  });

  it("expires after 24 hours", () => {
    const token = sealRound(round, SECRET);
    expect(openRound(token, SECRET, NOW + TOKEN_TTL_MS)).toEqual(round);
    expect(openRound(token, SECRET, NOW + TOKEN_TTL_MS + 1)).toBeNull();
  });

  it("rejects a sealed payload of the wrong shape", () => {
    const { id, ...withoutId } = round;
    expect(id).toBeTruthy();
    expect(openRound(sealRound(withoutId, SECRET), SECRET, NOW)).toBeNull();
  });

  it("throws a clear config error without a secret, never a default", () => {
    expect(() => sealRound(round, "")).toThrow(ConfigError);
    expect(() => sealRound(round, undefined)).toThrow(/ROUND_TOKEN_SECRET/);
    expect(() => openRound("x", "", NOW)).toThrow(ConfigError);
  });
});
