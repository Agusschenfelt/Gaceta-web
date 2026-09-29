import { describe, it, expect, beforeEach } from "vitest";
import { getPlayerId } from "./playerIdentity.js";
import { installLocalStorage, installFailingLocalStorage } from "../test-utils/localStorage.js";

beforeEach(() => installLocalStorage());

describe("getPlayerId", () => {
  it("generates an id and keeps it across calls", () => {
    const first = getPlayerId();
    expect(first).toBeTruthy();
    expect(getPlayerId()).toBe(first);
  });

  it("reuses an id already in storage", () => {
    localStorage.setItem("heardle:playerId", "existing-id");
    expect(getPlayerId()).toBe("existing-id");
  });

  it("still returns an id when storage throws", () => {
    installFailingLocalStorage();
    expect(getPlayerId()).toMatch(/[0-9a-f-]{36}/);
  });
});
