import { describe, expect, it } from "vitest";
import { ROUND_ERRORS, RoundError, fromApiError, toRoundError } from "./roundErrors.js";

describe("fromApiError", () => {
  it("keeps codes the browser has copy for", () => {
    for (const code of ["empty_pool", "round_not_found", "rate_limited", "captcha_failed"]) {
      const error = fromApiError(code);
      expect(error).toBeInstanceOf(RoundError);
      expect(error.code).toBe(code);
      expect(error.message).toBe(ROUND_ERRORS[code]);
    }
  });

  it("maps codes without browser copy, non-strings and inherited keys to unexpected", () => {
    for (const code of [
      "invalid_request", "payload_too_large", "method_not_allowed", "weird",
      "constructor", "toString", "__proto__", undefined, null, 42,
    ]) {
      const error = fromApiError(code);
      expect(error.code).toBe("unexpected");
      expect(error.message).toBe(ROUND_ERRORS.unexpected);
    }
  });

  it("never lets the server claim a retryable network error", () => {
    expect(fromApiError("network").code).toBe("unexpected");
  });
});

describe("toRoundError", () => {
  it("reads a known code out of the message", () => {
    expect(toRoundError({ message: "invalid_level" }).code).toBe("invalid_level");
  });

  it("falls back to a connection error for a fetch failure", () => {
    const e = toRoundError(new TypeError("Failed to fetch"));
    expect(e).toBeInstanceOf(RoundError);
    expect(e.code).toBe("network");
    expect(e.message).toMatch(/conectar/);
  });

  it("does not treat an unknown server error as a connection problem", () => {
    expect(toRoundError({ message: "something broke", code: "42883" }).code).toBe("unexpected");
  });

  it("passes a RoundError through untouched", () => {
    const e = new RoundError("rate_limited");
    expect(toRoundError(e)).toBe(e);
  });
});
