import { describe, it, expect, vi } from "vitest";
import { isCaptchaConfigured, buildRenderOptions } from "./captcha.js";

describe("isCaptchaConfigured", () => {
  it("is false with no site key, true with one", () => {
    expect(isCaptchaConfigured(undefined)).toBe(false);
    expect(isCaptchaConfigured("")).toBe(false);
    expect(isCaptchaConfigured("1x00000000000000000000AA")).toBe(true);
  });
});

describe("buildRenderOptions", () => {
  it("resolves the token via callback", () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const options = buildRenderOptions("site-key", { resolve, reject });
    expect(options.sitekey).toBe("site-key");
    expect(options.size).toBe("invisible");
    options.callback("a-token");
    expect(resolve).toHaveBeenCalledWith("a-token");
    expect(reject).not.toHaveBeenCalled();
  });

  it("rejects on error-callback and timeout-callback", () => {
    const resolve = vi.fn();
    const reject = vi.fn();
    const options = buildRenderOptions("site-key", { resolve, reject });
    options["error-callback"]();
    options["timeout-callback"]();
    expect(reject).toHaveBeenCalledTimes(2);
    expect(resolve).not.toHaveBeenCalled();
  });
});
