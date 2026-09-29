import { describe, expect, it } from "vitest";
import { shortcutFor } from "./shortcuts.js";

const body = { tagName: "BODY" };
const button = { tagName: "BUTTON" };
const input = { tagName: "INPUT" };

const key = (k, extra = {}) => ({ key: k, target: body, ...extra });

describe("shortcutFor", () => {
  it("Tab outside a field opens the search", () => {
    expect(shortcutFor(key("Tab"))).toBe("search");
    expect(shortcutFor(key("Tab", { target: button }))).toBe("search");
  });

  it("Space outside a field plays, even with a button focused", () => {
    expect(shortcutFor(key(" "))).toBe("play");
    expect(shortcutFor(key(" ", { target: button }))).toBe("play");
  });

  it("leaves both keys alone while typing", () => {
    expect(shortcutFor(key(" ", { target: input }))).toBeNull();
    expect(shortcutFor(key("Tab", { target: input }))).toBeNull();
    expect(shortcutFor(key(" ", { target: { tagName: "DIV", isContentEditable: true } }))).toBeNull();
  });

  it("keeps Shift+Tab native", () => {
    expect(shortcutFor(key("Tab", { shiftKey: true }))).toBeNull();
  });

  it("ignores modifier combos and a held Space", () => {
    expect(shortcutFor(key(" ", { ctrlKey: true }))).toBeNull();
    expect(shortcutFor(key("Tab", { metaKey: true }))).toBeNull();
    expect(shortcutFor(key(" ", { repeat: true }))).toBeNull();
  });

  it("ignores every other key", () => {
    expect(shortcutFor(key("Enter"))).toBeNull();
    expect(shortcutFor(key("a"))).toBeNull();
  });
});
