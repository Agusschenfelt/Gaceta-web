import { describe, it, expect } from "vitest";
import { search, normalize, MAX_RESULTS } from "./search.js";

const t = (title, artists = ["Ramma"]) => ({ id: title, title, artists });

describe("normalize", () => {
  it("lowercases, strips accents and collapses punctuation", () => {
    expect(normalize("Corazón   Partí'o!")).toBe("corazon parti o");
  });

  it("handles ñ and uppercase accents", () => {
    expect(normalize("AÑO ÚLTIMO")).toBe("ano ultimo");
  });

  it("returns an empty string for null-ish input", () => {
    expect(normalize(null)).toBe("");
    expect(normalize(undefined)).toBe("");
  });
});

describe("search", () => {
  it("returns nothing for an empty query", () => {
    expect(search("", [t("INMORTAL")])).toEqual([]);
    expect(search("   ", [t("INMORTAL")])).toEqual([]);
  });

  it("ranks a title prefix above a title substring", () => {
    const results = search("mor", [t("La Mordida"), t("MORTAL")]);
    expect(results.map((r) => r.title)).toEqual(["MORTAL", "La Mordida"]);
  });

  it("ranks a title match above an artist match", () => {
    const results = search("dazen", [t("Otro tema", ["Dazen"]), t("Dazen y yo", ["Ramma"])]);
    expect(results[0].title).toBe("Dazen y yo");
  });

  it("matches ignoring accents in both query and title", () => {
    expect(search("corazon", [t("Corazón")])).toHaveLength(1);
    expect(search("Corazón", [t("corazon")])).toHaveLength(1);
  });

  it("finds a track by artist name", () => {
    const results = search("valuto", [t("Tema", ["Valuto"])]);
    expect(results).toHaveLength(1);
  });

  it("caps the result count", () => {
    const tracks = Array.from({ length: 30 }, (_, i) => t(`Tema ${i}`));
    expect(search("tema", tracks)).toHaveLength(MAX_RESULTS);
  });

  it("excludes tracks that match nothing", () => {
    expect(search("zzz", [t("INMORTAL")])).toEqual([]);
  });
});
