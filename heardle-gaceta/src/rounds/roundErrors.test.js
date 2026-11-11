import { describe, expect, it } from "vitest";
import { ROUND_ERRORS, RoundError, fromApiError } from "./roundErrors.js";

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
