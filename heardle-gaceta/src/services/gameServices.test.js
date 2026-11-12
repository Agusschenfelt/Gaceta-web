import { describe, expect, it, vi } from "vitest";
import { createApiServices } from "./gameServices.js";

describe("createApiServices", () => {
  it("plays rounds through the API and subscribes emails through /api/subscribe", async () => {
    const fetch = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) }));
    const services = createApiServices({ fetch, storage: null, captcha: async () => "tok", siteKey: "k" });
    expect(services.rounds.mode).toBe("api");
    await services.board.subscribeEmail("a@b.co");
    expect(fetch.mock.calls[0][0]).toBe("/api/subscribe");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "a@b.co", captchaToken: "tok" });
  });
});
