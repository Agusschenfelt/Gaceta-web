import { describe, it, expect } from "vitest";
import { resolveDealtFilter } from "./dealtFilter.js";

const fresh = { id: "r1", attempts: [] };
const resumed = { id: "r1", attempts: ["skip"] };

describe("resolveDealtFilter", () => {
  it("uses the filter remembered for this round, even if the chips changed since", () => {
    expect(resolveDealtFilter(resumed, ["ara"], { roundId: "r1", filter: ["ramma"] })).toEqual([
      "ramma",
    ]);
  });

  it("does not guess the filter of a resumed round it has no record of", () => {
    expect(resolveDealtFilter(resumed, ["ara"], null)).toBeNull();
    expect(resolveDealtFilter(resumed, ["ara"], { roundId: "r0", filter: ["ramma"] })).toBeNull();
  });

  it("takes the requested filter for a round that was just dealt", () => {
    expect(resolveDealtFilter(fresh, ["ara"], { roundId: "r0", filter: ["ramma"] })).toEqual([
      "ara",
    ]);
    expect(resolveDealtFilter(fresh, [], null)).toEqual([]);
  });
});
