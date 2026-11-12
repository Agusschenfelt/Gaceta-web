import { describe, it, expect } from "vitest";
import { audioKey } from "../../scripts/lib/audioKey.mjs";
import { readConfig } from "./config.js";
import { ConfigError } from "./roundToken.js";

describe("readConfig", () => {
  it("requires ROUND_TOKEN_SECRET", () => {
    expect(() => readConfig({})).toThrow(ConfigError);
    expect(() => readConfig({ AUDIO_KEY_SECRET: "a" })).toThrow(/ROUND_TOKEN_SECRET/);
  });

  it("derives audio keys with the shared HMAC", () => {
    const { audioKeyFor } = readConfig({ ROUND_TOKEN_SECRET: "t", AUDIO_KEY_SECRET: "a" });
    expect(audioKeyFor("UYT142400046")).toBe(audioKey("UYT142400046", "a"));
    expect(audioKeyFor("UYT142400046")).not.toContain("UYT");
  });

  it("refuses to run deployed without AUDIO_KEY_SECRET", () => {
    for (const VERCEL_ENV of ["production", "preview"]) {
      expect(() => readConfig({ ROUND_TOKEN_SECRET: "t", VERCEL_ENV })).toThrow(/AUDIO_KEY_SECRET/);
    }
  });

  it("falls back to the ISRC only off Vercel, for local development", () => {
    expect(readConfig({ ROUND_TOKEN_SECRET: "t" }).audioKeyFor("X1")).toBe("X1");
    expect(readConfig({ ROUND_TOKEN_SECRET: "t", VERCEL_ENV: "development" }).audioKeyFor("X1")).toBe("X1");
  });
});
