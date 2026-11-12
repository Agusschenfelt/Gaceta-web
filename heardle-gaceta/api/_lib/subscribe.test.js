import { afterEach, describe, expect, it, vi } from "vitest";
import { ConfigError } from "./roundToken.js";
import { SOURCE, readSubscribeConfig, subscribeEndpoint } from "./subscribe.js";

const OK_ENV = { DATABASE_URL: "postgres://x", TURNSTILE_SECRET_KEY: "ts", RESEND_API_KEY: "re" };

const json = (body, ok = true, status = 200) => ({ ok, status, json: async () => body });

/** A tagged-template stand-in for the Neon driver; records the bound values. */
function fakeSql(rows = [{ id: "u1" }]) {
  const calls = [];
  const sql = vi.fn(async (strings, ...values) => {
    calls.push({ text: strings.join("?"), values });
    if (rows instanceof Error) throw rows;
    return rows;
  });
  sql.calls = calls;
  return sql;
}

/** Never answers; rejects like a real fetch when its AbortSignal fires. */
const hang = Symbol("hang");

function setup({
  sql = fakeSql(),
  env = OK_ENV,
  captcha = json({ success: true }),
  resend = json({ id: "m" }),
  timeouts = {},
} = {}) {
  const fetch = vi.fn((url, init) => {
    const result = url.includes("siteverify") ? captcha : resend;
    if (result === hang) {
      return new Promise((_, reject) =>
        init.signal.addEventListener("abort", () => reject(init.signal.reason))
      );
    }
    return (async () => {
      if (result instanceof Error) throw result;
      return result;
    })();
  });
  const endpoint = subscribeEndpoint({ sql, fetch, ...timeouts, readConfig: () => readSubscribeConfig(env) });
  const post = (body, headers = {}) =>
    endpoint.fetch(
      new Request("http://x/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify(body),
      }),
    );
  const resendCalls = () => fetch.mock.calls.filter(([url]) => url.includes("resend"));
  return { fetch, sql, post, resendCalls, endpoint };
}

afterEach(() => vi.restoreAllMocks());

describe("readSubscribeConfig", () => {
  it("requires DATABASE_URL", () => {
    expect(() => readSubscribeConfig({})).toThrow(ConfigError);
  });

  it("requires the Turnstile secret only when deployed", () => {
    const base = { DATABASE_URL: "d" };
    for (const VERCEL_ENV of ["production", "preview"]) {
      expect(() => readSubscribeConfig({ ...base, VERCEL_ENV })).toThrow(/TURNSTILE_SECRET_KEY/);
    }
    expect(readSubscribeConfig(base).turnstileSecret).toBe("");
    expect(readSubscribeConfig({ ...base, VERCEL_ENV: "development" }).turnstileSecret).toBe("");
  });
});

describe("POST /api/subscribe", () => {
  it("rejects non-POST", async () => {
    const { endpoint } = setup();
    const res = await endpoint.fetch(new Request("http://x/api/subscribe"));
    expect(res.status).toBe(405);
  });

  it("rejects an invalid email before touching captcha or database", async () => {
    const { post, fetch, sql } = setup();
    for (const email of ["", "nope", "a@b", 42, undefined]) {
      const res = await post({ email, captchaToken: "t" });
      expect(res.status).toBe(400);
      expect(await res.json()).toEqual({ error: "invalid_email" });
    }
    expect(fetch).not.toHaveBeenCalled();
    expect(sql).not.toHaveBeenCalled();
  });

  it("answers 403 captcha_failed when Turnstile refuses, a token is missing or it is unreachable", async () => {
    for (const [captcha, captchaToken] of [
      [json({ success: false }), "t"],
      [json({ success: true }), undefined],
      [new TypeError("offline"), "t"],
    ]) {
      const { post, sql } = setup({ captcha });
      const res = await post({ email: "a@b.co", captchaToken });
      expect(res.status).toBe(403);
      expect(await res.json()).toEqual({ error: "captcha_failed" });
      expect(sql).not.toHaveBeenCalled();
    }
  });

  it("sends the secret, token and first x-forwarded-for hop to Turnstile", async () => {
    const { post, fetch } = setup();
    await post({ email: "a@b.co", captchaToken: "tok" }, { "x-forwarded-for": "1.2.3.4, 5.6.7.8" });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe("https://challenges.cloudflare.com/turnstile/v0/siteverify");
    expect(Object.fromEntries(init.body)).toEqual({ secret: "ts", response: "tok", remoteip: "1.2.3.4" });
  });

  it("skips the captcha without a secret when not deployed", async () => {
    const { post, fetch } = setup({ env: { DATABASE_URL: "d" } });
    const res = await post({ email: "a@b.co" });
    expect(res.status).toBe(200);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("answers 500 unexpected for a deployed environment missing secrets", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    for (const env of [{ ...OK_ENV, VERCEL_ENV: "production", TURNSTILE_SECRET_KEY: "" }, { VERCEL_ENV: "production" }]) {
      const { post } = setup({ env });
      const res = await post({ email: "a@b.co", captchaToken: "t" });
      expect(res.status).toBe(500);
      expect(await res.json()).toEqual({ error: "unexpected" });
    }
  });

  it("stores a normalized new address and sends one welcome with an idempotency key", async () => {
    const { post, sql, resendCalls } = setup();
    const res = await post({ email: "  Fan@Example.COM ", captchaToken: "t" });
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ ok: true });
    expect(sql.calls[0].values).toEqual(["fan@example.com", SOURCE]);
    expect(sql.calls[0].text).toContain("on conflict (email, source) do nothing");
    const calls = resendCalls();
    expect(calls).toHaveLength(1);
    const [url, init] = calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re");
    expect(init.headers["Idempotency-Key"]).toMatch(/^welcome-[0-9a-f]{64}$/);
    expect(JSON.parse(init.body).to).toEqual(["fan@example.com"]);
  });

  it("treats a duplicate as success without sending email", async () => {
    const { post, resendCalls } = setup({ sql: fakeSql([]) });
    const res = await post({ email: "a@b.co", captchaToken: "t" });
    expect(res.status).toBe(200);
    expect(resendCalls()).toHaveLength(0);
  });

  it("still succeeds when Resend fails, errors or has no key, without logging the address", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    for (const setupArgs of [
      { resend: json({}, false, 500) },
      { resend: new TypeError("offline") },
      { env: { ...OK_ENV, RESEND_API_KEY: "" } },
    ]) {
      const { post } = setup(setupArgs);
      const res = await post({ email: "secret@example.com", captchaToken: "t" });
      expect(res.status).toBe(200);
    }
    expect(warn).toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret@example.com");
  });

  it("answers 500 unexpected on a database error without leaking it", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { post } = setup({ sql: fakeSql(new Error("connection to db.neon.tech refused")) });
    const res = await post({ email: "a@b.co", captchaToken: "t" });
    expect(res.status).toBe(500);
    const text = await res.text();
    expect(text).toBe(JSON.stringify({ error: "unexpected" }));
    expect(JSON.stringify(err.mock.calls)).not.toContain("a@b.co");
  });

  it("answers 403 captcha_failed when Turnstile is too slow, without storing", async () => {
    const { post, sql, fetch } = setup({ captcha: hang, timeouts: { turnstileTimeoutMs: 10 } });
    const res = await post({ email: "a@b.co", captchaToken: "t" });
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ error: "captcha_failed" });
    expect(sql).not.toHaveBeenCalled();
    expect(fetch.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("still succeeds, with a warning, when Resend is too slow", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { post, sql, resendCalls } = setup({ resend: hang, timeouts: { resendTimeoutMs: 10 } });
    const res = await post({ email: "secret@example.com", captchaToken: "t" });
    expect(res.status).toBe(200);
    expect(sql).toHaveBeenCalledTimes(1);
    expect(resendCalls()).toHaveLength(1);
    expect(warn).toHaveBeenCalled();
    expect(JSON.stringify(warn.mock.calls)).not.toContain("secret@example.com");
  });

  it("rejects a malformed body", async () => {
    const { endpoint } = setup();
    const res = await endpoint.fetch(new Request("http://x/api/subscribe", { method: "POST", body: "{nope" }));
    expect(res.status).toBe(400);
  });
});
