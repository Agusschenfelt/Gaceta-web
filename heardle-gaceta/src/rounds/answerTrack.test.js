import { describe, it, expect } from "vitest";
import { answerTrack } from "./answerTrack.js";

const artists = [{ slug: "ramma", name: "Ramma" }, { slug: "ara", name: "ARA" }];
const inCatalog = { id: "A", title: "Uno", artists: ["Ramma"], coverUrl: "c", spotifyUrl: "s" };
const tracksById = new Map([["A", inCatalog]]);

describe("answerTrack", () => {
  it("uses the catalog entry when the browser has it", () => {
    expect(answerTrack({ answerId: "A" }, tracksById, artists)).toBe(inCatalog);
  });

  it("falls back to what the server returned, with artist names", () => {
    const round = { answerId: "Z", answer: { id: "Z", title: "Zeta", artistSlugs: ["ara", "gone"] } };
    expect(answerTrack(round, tracksById, artists)).toEqual({
      id: "Z",
      title: "Zeta",
      artists: ["ARA", "gone"],
      coverUrl: null,
      spotifyUrl: null,
    });
  });

  it("still renders something when the server sent no details", () => {
    const t = answerTrack({ answerId: "Z" }, tracksById, artists);
    expect(t.title).toBeTruthy();
    expect(t.artists).toEqual([]);
  });
});
