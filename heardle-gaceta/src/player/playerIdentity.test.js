import { describe, it, expect, beforeEach } from "vitest";
import {
  getPlayerId,
  getAlias,
  setAlias,
  isValidAlias,
  normalizeAlias,
  ALIAS_MIN,
  ALIAS_MAX,
} from "./playerIdentity.js";
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

describe("isValidAlias", () => {
  it("rejects anything shorter than the minimum", () => {
    expect(isValidAlias("a".repeat(ALIAS_MIN - 1))).toBe(false);
  });

  it("rejects anything longer than the maximum", () => {
    expect(isValidAlias("a".repeat(ALIAS_MAX + 1))).toBe(false);
  });

  it("accepts the bounds themselves", () => {
    expect(isValidAlias("a".repeat(ALIAS_MIN))).toBe(true);
    expect(isValidAlias("a".repeat(ALIAS_MAX))).toBe(true);
  });

  it("measures the trimmed value", () => {
    expect(isValidAlias("   a   ")).toBe(false);
    expect(isValidAlias("  ok  ")).toBe(true);
  });

  it("rejects null-ish input", () => {
    expect(isValidAlias(null)).toBe(false);
    expect(isValidAlias(undefined)).toBe(false);
  });
});

describe("setAlias", () => {
  it("trims, stores and returns the alias", () => {
    expect(setAlias("  Agus  ")).toBe("Agus");
    expect(getAlias()).toBe("Agus");
  });

  it("refuses an invalid alias", () => {
    expect(() => setAlias("x")).toThrow();
    expect(getAlias()).toBe("");
  });
});

describe("getAlias", () => {
  it("is an empty string before anyone chose one", () => {
    expect(getAlias()).toBe("");
  });
});

describe("alias shape (mirrors set_alias in supabase/schema.sql)", () => {
  it("accepts letters with accents, digits, spaces, dots, underscores and dashes", () => {
    expect(isValidAlias("Tadu Vázquez")).toBe(true);
    expect(isValidAlias("ñandú_22.b-c")).toBe(true);
  });

  it("refuses markup and symbols", () => {
    expect(isValidAlias("<script>")).toBe(false);
    expect(isValidAlias("a@b")).toBe(false);
  });

  it("collapses inner spaces before measuring", () => {
    expect(normalizeAlias("  Agus   ok ")).toBe("Agus ok");
  });
});
