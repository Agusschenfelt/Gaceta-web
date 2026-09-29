import { describe, expect, it } from "vitest";
import { signInFailure } from "./supabaseServices.js";

describe("signInFailure", () => {
  it("keeps a dropped request retryable", () => {
    expect(signInFailure(new TypeError("Failed to fetch")).code).toBe("network");
    expect(signInFailure({ name: "AuthRetryableFetchError", message: "", status: 0 }).code).toBe(
      "network"
    );
  });

  it("treats a refused sign-in as not authenticated", () => {
    const refused = { message: "captcha protection: request disallowed (no captcha_token found)", status: 400 };
    expect(signInFailure(refused).code).toBe("not_authenticated");
  });
});
