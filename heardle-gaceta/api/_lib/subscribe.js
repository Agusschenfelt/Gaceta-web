/**
 * Email opt-in: verify the Turnstile token, store the address in the shared
 * Neon `subscribers` table (db/subscribers.sql) and, only for a new address,
 * send the welcome through Resend. A welcome that fails never fails the
 * subscription: the address is already saved.
 *
 * `run` is the testable core; the endpoint in api/subscribe.js is a wrapper.
 * `sql`, `fetch` and `env` are injectable.
 */
import process from "node:process";
import { neon } from "@neondatabase/serverless";
import { ArbiterError } from "./arbiter.js";
import { NO_STORE, fail, readBody } from "./http.js";
import { ConfigError } from "./roundToken.js";
import { idempotencyKey, isDeliverableAddress, welcomeMessage } from "./welcomeMessage.js";

export const SOURCE = "heardle";
const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const RESEND_URL = "https://api.resend.com/emails";

// Neither call may hold the function open: Turnstile gates the signup, Resend is a courtesy.
export const TURNSTILE_TIMEOUT_MS = 5000;
export const RESEND_TIMEOUT_MS = 5000;

export class SubscribeError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function isDeployed(env) {
  return Boolean(env.VERCEL_ENV && env.VERCEL_ENV !== "development");
}

/** Server-only settings. Throws ConfigError for a deployment mistake. */
export function readSubscribeConfig(env = process.env) {
  if (!env.DATABASE_URL) throw new ConfigError("DATABASE_URL is not set");
  const turnstileSecret = env.TURNSTILE_SECRET_KEY ?? "";
  // No secret means no captcha: tolerable off Vercel only.
  if (!turnstileSecret && isDeployed(env)) {
    throw new ConfigError("TURNSTILE_SECRET_KEY is required in a deployed environment");
  }
  return { databaseUrl: env.DATABASE_URL, turnstileSecret, resendKey: env.RESEND_API_KEY ?? "" };
}

async function verifyCaptcha({ secret, token, ip, fetch, timeoutMs }) {
  if (!secret) return; // development without a secret
  if (typeof token !== "string" || token === "") throw new SubscribeError("captcha_failed");
  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);
  let data;
  try {
    const response = await fetch(SITEVERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(timeoutMs),
    });
    data = await response.json();
  } catch (error) {
    // Cannot verify (unreachable or too slow): refuse rather than let bots through.
    console.warn("subscribe: Turnstile siteverify failed", error?.name ?? "error");
    throw new SubscribeError("captcha_failed");
  }
  if (data?.success !== true) {
    // Cloudflare's error codes (e.g. invalid-input-secret) carry no secret and
    // are the only way to tell a misconfigured key from a bot.
    console.warn("subscribe: Turnstile rejected the token", JSON.stringify(data?.["error-codes"] ?? []));
    throw new SubscribeError("captcha_failed");
  }
}

async function sendWelcome({ email, resendKey, fetch, timeoutMs }) {
  if (!resendKey) {
    console.warn("subscribe: RESEND_API_KEY is not set, welcome email skipped");
    return;
  }
  try {
    const response = await fetch(RESEND_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": await idempotencyKey(email),
      },
      body: JSON.stringify(welcomeMessage(email)),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) console.warn("subscribe: Resend rejected the welcome email", response.status);
  } catch (error) {
    console.warn("subscribe: Resend request failed", error?.name ?? "error");
  }
}

/**
 * @param {{ email?: unknown, captchaToken?: unknown }} body
 * @param {{ ip?: string, sql: Function, fetch: Function, config: object,
 *   turnstileTimeoutMs?: number, resendTimeoutMs?: number }} deps
 * @returns {Promise<{ inserted: boolean }>}
 */
export async function run(
  body,
  { ip, sql, fetch, config, turnstileTimeoutMs = TURNSTILE_TIMEOUT_MS, resendTimeoutMs = RESEND_TIMEOUT_MS }
) {
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!isDeliverableAddress(email)) throw new SubscribeError("invalid_email");

  await verifyCaptcha({ secret: config.turnstileSecret, token: body.captchaToken, ip, fetch, timeoutMs: turnstileTimeoutMs });

  const rows = await sql`
    insert into public.subscribers (email, source)
    values (${email}, ${SOURCE})
    on conflict (email, source) do nothing
    returning id`;
  const inserted = rows.length > 0;
  if (inserted) await sendWelcome({ email, resendKey: config.resendKey, fetch, timeoutMs: resendTimeoutMs });
  return { inserted };
}

/**
 * Builds the endpoint. `readConfig`, `sql` and `fetch` are injectable for tests;
 * by default the Neon HTTP driver is created per request from DATABASE_URL.
 */
export function subscribeEndpoint(overrides = {}) {
  return {
    async fetch(request) {
      if (request.method !== "POST") return fail("method_not_allowed");
      try {
        const config = (overrides.readConfig ?? readSubscribeConfig)();
        const body = await readBody(request);
        const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;
        await run(body, {
          ip,
          config,
          sql: overrides.sql ?? neon(config.databaseUrl),
          fetch: overrides.fetch ?? globalThis.fetch,
          turnstileTimeoutMs: overrides.turnstileTimeoutMs,
          resendTimeoutMs: overrides.resendTimeoutMs,
        });
        return Response.json({ ok: true }, { headers: NO_STORE });
      } catch (error) {
        if (error instanceof SubscribeError) return fail(error.code);
        if (error instanceof ArbiterError) return fail(error.code);
        // Config mistakes, database outages and bugs: log for the operator
        // (never the address), tell the client nothing.
        console.error("subscribe: unexpected failure", error instanceof ConfigError ? error.message : error?.name);
        return fail("unexpected");
      }
    },
  };
}

