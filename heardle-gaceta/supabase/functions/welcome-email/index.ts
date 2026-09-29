// Supabase Edge Function: sends the welcome email through Resend.
// Deployed with --no-verify-jwt; the only caller is the trigger in supabase/schema.sql,
// which proves itself with the shared `x-welcome-secret` header.
import { idempotencyKey, isDeliverableAddress, welcomeMessage } from "./message.js";

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Compares SHA-256 digests byte by byte without early exit, so timing does not leak the secret.
async function safeEqual(a: string, b: string): Promise<boolean> {
  const enc = new TextEncoder();
  const [da, db] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(a)),
    crypto.subtle.digest("SHA-256", enc.encode(b)),
  ]);
  const x = new Uint8Array(da);
  const y = new Uint8Array(db);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") return json(405, { error: "method_not_allowed" });

  const expected = Deno.env.get("WELCOME_HOOK_SECRET");
  if (!expected) {
    console.error("WELCOME_HOOK_SECRET is not set; rejecting every request");
    return json(500, { error: "not_configured" });
  }
  const provided = req.headers.get("x-welcome-secret") ?? "";
  if (!(await safeEqual(provided, expected))) return json(401, { error: "unauthorized" });

  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return json(400, { error: "invalid_body" });
  }
  if (!isDeliverableAddress(email)) return json(400, { error: "invalid_email" });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return json(500, { error: "not_configured" });
  }

  let res: Response;
  try {
    res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": await idempotencyKey(email),
      },
      body: JSON.stringify(welcomeMessage(email)),
    });
  } catch (err) {
    console.error("Resend request failed", String(err));
    return json(502, { error: "resend_unreachable" });
  }

  if (!res.ok) {
    console.error("Resend rejected the email", res.status, await res.text());
    return json(502, { error: "resend_failed" });
  }
  const { id } = await res.json();
  return json(200, { id });
});
