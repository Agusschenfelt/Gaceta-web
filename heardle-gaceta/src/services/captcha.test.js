import { describe, it, expect, vi } from "vitest";
import { isCaptchaConfigured, buildRenderOptions, isRetryableCode, MAX_CHALLENGE_RETRIES } from "./captcha.js";

describe("isCaptchaConfigured", () => {
  it("is false with no site key, true with one", () => {
    expect(isCaptchaConfigured(undefined)).toBe(false);
    expect(isCaptchaConfigured("")).toBe(false);
    expect(isCaptchaConfigured("1x00000000000000000000AA")).toBe(true);
  });
});

describe("isRetryableCode", () => {
  it("retries generic challenge failures and transient errors", () => {
    for (const code of ["300030", "600010", "110600", "110620", "200500", 600010]) {
      expect(isRetryableCode(code)).toBe(true);
    }
  });

  it("does not retry configuration errors", () => {
    for (const code of ["110100", "110200", "400020", "200100", undefined, ""]) {
      expect(isRetryableCode(code)).toBe(false);
    }
  });
});

function setup() {
  const resolve = vi.fn();
  const reject = vi.fn();
  const options = buildRenderOptions("site-key", { resolve, reject });
  return { resolve, reject, options };
}

describe("buildRenderOptions", () => {
  it("resolves the token via callback", () => {
    const { resolve, reject, options } = setup();
    expect(options.sitekey).toBe("site-key");
    // The widget mode (Invisible) lives in the Cloudflare dashboard; `size` only takes
    // normal | flexible | compact, so it must not be sent.
    expect(options).not.toHaveProperty("size");
    options.callback("a-token");
    expect(resolve).toHaveBeenCalledWith("a-token");
    expect(reject).not.toHaveBeenCalled();
  });

  it("lets Turnstile retry a transient failure before giving up", () => {
    const { reject, options } = setup();
    expect(options.retry).toBe("auto");
    for (let i = 0; i < MAX_CHALLENGE_RETRIES; i += 1) {
      expect(options["error-callback"]("600010")).toBe(false);
    }
    expect(reject).not.toHaveBeenCalled();
    expect(options["error-callback"]("600010")).toBe(true);
    expect(reject).toHaveBeenCalledTimes(1);
    expect(reject.mock.calls[0][0].message).toContain("600010");
  });

  it("rejects a configuration error right away, with its code", () => {
    const { reject, options } = setup();
    expect(options["error-callback"]("110200")).toBe(true);
    expect(reject).toHaveBeenCalledTimes(1);
    expect(reject.mock.calls[0][0].message).toContain("110200");
  });

  it("rejects on timeout-callback", () => {
    const { resolve, reject, options } = setup();
    options["timeout-callback"]();
    expect(reject).toHaveBeenCalledTimes(1);
    expect(resolve).not.toHaveBeenCalled();
  });
});
