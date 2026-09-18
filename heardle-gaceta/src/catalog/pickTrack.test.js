import { describe, it, expect, beforeEach } from "vitest";
import { pickTrack, filterPool } from "./pickTrack.js";
import { installLocalStorage, installFailingLocalStorage } from "../test-utils/localStorage.js";

const t = (id, slugs) => ({ id, title: id, artists: ["X"], artistSlugs: slugs });

const pool = [
  t("A", ["ramma"]),
  t("B", ["valuto"]),
  t("C", ["ramma", "ara"]),
];

beforeEach(() => installLocalStorage());

describe("filterPool", () => {
  it("returns everything when no artist is selected", () => {
    expect(filterPool(pool, [])).toHaveLength(3);
    expect(filterPool(pool, undefined)).toHaveLength(3);
  });

  it("keeps a track if any of its slugs is selected", () => {
    expect(filterPool(pool, ["ara"]).map((x) => x.id)).toEqual(["C"]);
    expect(filterPool(pool, ["ramma"]).map((x) => x.id)).toEqual(["A", "C"]);
  });

  it("unions several selected artists", () => {
    expect(filterPool(pool, ["valuto", "ara"]).map((x) => x.id)).toEqual(["B", "C"]);
  });
});

describe("pickTrack", () => {
  it("returns null when the filtered pool is empty", () => {
    expect(pickTrack(pool, ["nadie"])).toBeNull();
  });

  it("picks from the filtered pool only", () => {
    expect(pickTrack(pool, ["valuto"]).id).toBe("B");
  });

  it("avoids tracks played recently", () => {
    localStorage.setItem("heardle:recent", JSON.stringify(["A", "B"]));
    // random() = 0 would pick "A" from the full pool; "C" is the only fresh one.
    expect(pickTrack(pool, [], () => 0).id).toBe("C");
  });

  it("falls back to the full pool once everything is recent", () => {
    localStorage.setItem("heardle:recent", JSON.stringify(["A", "B", "C"]));
    expect(pickTrack(pool, [], () => 0).id).toBe("A");
  });

  it("records what it played", () => {
    pickTrack(pool, [], () => 0);
    expect(JSON.parse(localStorage.getItem("heardle:recent"))).toEqual(["A"]);
  });

  it("caps the recent list", () => {
    const many = Array.from({ length: 30 }, (_, i) => t(`T${i}`, ["ramma"]));
    for (let i = 0; i < 20; i++) pickTrack(many, [], () => i / 20);
    expect(JSON.parse(localStorage.getItem("heardle:recent")).length).toBeLessThanOrEqual(10);
  });

  it("still picks when storage throws", () => {
    installFailingLocalStorage();
    expect(pickTrack(pool, [], () => 0).id).toBe("A");
  });
});
