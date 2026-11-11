import { describe, expect, it } from "vitest";
import { createApiServices } from "./gameServices.js";

describe("createApiServices", () => {
  it("plays rounds through the API and refuses emails until T3", async () => {
    const services = createApiServices({ fetch: async () => ({}), storage: null });
    expect(services.rounds.mode).toBe("api");
    await expect(services.board.subscribeEmail("a@b.co")).rejects.toMatchObject({
      code: "local_unavailable",
    });
  });
});
