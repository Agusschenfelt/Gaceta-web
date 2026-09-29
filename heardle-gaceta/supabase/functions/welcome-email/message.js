// Pure builder for the welcome email. Only web-standard APIs (Web Crypto), so vitest
// can import it and the Edge Function can reuse it through a relative import.

const FROM = "GACETA <bienvenida@esgaceta.com>";
const REPLY_TO = "contacto@gacetaplay.com";
const SITE_URL = "https://esgaceta.com";
const GAME_URL = "https://heardle-gaceta.vercel.app";
const SUBJECT = "Gracias por sumarte a GACETA";

// Same shape as `email_shape` in supabase/schema.sql.
const EMAIL_SHAPE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/i;

export function isDeliverableAddress(email) {
  return typeof email === "string" && email.length <= 254 && EMAIL_SHAPE.test(email);
}

/**
 * Resend's Idempotency-Key for this address: a retried call must not send twice.
 * Hashed, not the raw address: Resend caps the key at 256 characters and fetch
 * refuses non-Latin-1 header values, so a long or non-ASCII address would fail
 * the send. SHA-256 hex is always 64 ASCII characters.
 */
export async function idempotencyKey(email) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(email));
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `welcome-${hex}`;
}

const TEXT = [
  "Gracias por sumarte a GACETA.",
  "",
  "Gracias por jugar al heardle de GACETA. Vas a ser de los primeros en enterarte cuando salga música nueva del sello.",
  "",
  `Conocé más sobre GACETA: ${SITE_URL}`,
  `Jugá otra ronda: ${GAME_URL}`,
  "",
  "Si no querés recibir más mails, respondé a este mail y te sacamos de la lista.",
  "",
  "GACETA",
].join("\n");

// Hex colors are allowed here: this is an email, not a UI component, so it cannot use
// the app's Tailwind tokens. Values mirror src/theme/tokens.css (bg, fg, accent).
const HTML = `<!doctype html>
<html lang="es">
<body style="margin:0;padding:0;background:#0a0a0a;">
<div style="background:#0a0a0a;padding:40px 24px;font-family:Inter,Arial,sans-serif;color:#ffffff;">
<div style="max-width:480px;margin:0 auto;">
<h1 style="margin:0 0 24px;font-size:28px;line-height:1.1;font-weight:700;letter-spacing:-0.02em;color:#ffffff;">Gracias por sumarte a GACETA</h1>
<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#ffffff;">Gracias por jugar al heardle de GACETA. Vas a ser de los primeros en enterarte cuando salga música nueva del sello.</p>
<p style="margin:0 0 8px;font-size:16px;line-height:1.5;color:#ffffff;">Conocé más sobre GACETA: <a href="${SITE_URL}" style="color:#dee5a0;">esgaceta.com</a></p>
<p style="margin:0 0 32px;font-size:16px;line-height:1.5;color:#ffffff;">Jugá otra ronda: <a href="${GAME_URL}" style="color:#dee5a0;">heardle-gaceta.vercel.app</a></p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#ffffff;opacity:0.6;">Si no querés recibir más mails, respondé a este mail y te sacamos de la lista.</p>
</div>
</div>
</body>
</html>`;

export function welcomeMessage(email) {
  return { from: FROM, reply_to: REPLY_TO, to: [email], subject: SUBJECT, html: HTML, text: TEXT };
}
