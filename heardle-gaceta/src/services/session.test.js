import { describe, it, expect } from "vitest";
import { isDeadSession } from "./session.js";

describe("isDeadSession", () => {
  it("treats a deleted user or a rejected token as dead", () => {
    expect(isDeadSession({ code: "user_not_found", status: 403 })).toBe(true);
    expect(isDeadSession({ status: 401 })).toBe(true);
    expect(isDeadSession({ code: "bad_jwt" })).toBe(true);
  });

  it("keeps the session on no error or a connection problem", () => {
    expect(isDeadSession(null)).toBe(false);
    expect(isDeadSession({ name: "AuthRetryableFetchError", status: 0 })).toBe(false);
    expect(isDeadSession({ status: 500 })).toBe(false);
  });
});
