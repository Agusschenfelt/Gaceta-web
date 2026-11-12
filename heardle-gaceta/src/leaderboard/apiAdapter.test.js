import { describe, expect, it, vi } from "vitest";
import { createApiAdapter } from "./apiAdapter.js";

const reply = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

function setup({ response = reply({ ok: true }), captcha = async () => "tok" } = {}) {
  const fetch = vi.fn(async () => {
    if (response instanceof Error) throw response;
    return response;
  });
  return { fetch, adapter: createApiAdapter({ fetch, captcha, siteKey: "site" }) };
}

describe("apiAdapter.subscribeEmail", () => {
  it("posts the email with a fresh captcha token", async () => {
    const captcha = vi.fn(async () => "tok");
    const { fetch, adapter } = setup({ captcha });
    await adapter.subscribeEmail("fan@example.com");
    expect(captcha).toHaveBeenCalledWith("site");
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("/api/subscribe");
    expect(JSON.parse(init.body)).toEqual({ email: "fan@example.com", captchaToken: "tok" });
  });

  it("works without a captcha (no site key configured)", async () => {
    const { fetch, adapter } = setup({ captcha: async () => undefined });
    await adapter.subscribeEmail("fan@example.com");
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ email: "fan@example.com" });
  });

  it("maps server error codes", async () => {
    for (const code of ["invalid_email", "captcha_failed"]) {
      const { adapter } = setup({ response: reply({ error: code }, 400) });
      await expect(adapter.subscribeEmail("x@y.co")).rejects.toMatchObject({ code });
    }
    const { adapter } = setup({ response: reply({ error: "unexpected" }, 500) });
    await expect(adapter.subscribeEmail("x@y.co")).rejects.toMatchObject({ code: "unexpected" });
  });

  it("reports a captcha that could not run, without calling the server", async () => {
    const { fetch, adapter } = setup({
      captcha: async () => {
        throw new Error("boom");
      },
    });
    await expect(adapter.subscribeEmail("x@y.co")).rejects.toMatchObject({ code: "captcha_failed" });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("maps a dropped request to network", async () => {
    const { adapter } = setup({ response: new TypeError("Failed to fetch") });
    await expect(adapter.subscribeEmail("x@y.co")).rejects.toMatchObject({ code: "network" });
  });
});
