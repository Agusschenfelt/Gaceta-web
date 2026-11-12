// Pure builder for the welcome email. Only web-standard APIs (Web Crypto), so it runs
// in Vercel Functions and in vitest.

const FROM = "GACETA <bienvenida@esgaceta.com>";
const REPLY_TO = "contacto@gacetaplay.com";
const SITE_URL = "https://esgaceta.com";
const GAME_URL = "https://heardle.esgaceta.com";
const SUBJECT = "Gracias por sumarte a GACETA";

// Same shape as `email_shape` in db/subscribers.sql.
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

// Brand images for the email, served from the game's own deploy (public/email/).
// PNG, not webp (Outlook), and absolute (mail clients have no base url).
const ASSET_URL = `${GAME_URL}/email`;
const SOCIALS = [
  ["Instagram", "https://www.instagram.com/esgaceta"],
  ["TikTok", "https://www.tiktok.com/@esgaceta"],
  ["YouTube", "https://www.youtube.com/@esgaceta"],
  ["X", "https://x.com/esgaceta"],
];

const TEXT = [
  "GACETA · Heardle",
  "",
  "Gracias por sumarte.",
  "",
  "Jugaste al heardle de GACETA. Ahora vas a ser de los primeros en enterarte cuando salga música nueva del sello.",
  "",
  `Jugá otra ronda: ${GAME_URL}`,
  `Conocé el sello: ${SITE_URL}`,
  "",
  "La escena, en primera plana.",
  `Seguinos en @esgaceta: ${SOCIALS.map(([, url]) => url).join(" · ")}`,
  "",
  "Si no querés recibir más mails, respondé a este mail y te sacamos de la lista.",
].join("\n");

// Hex colors are allowed here: this is an email, not a UI component, so it cannot use
// the app's Tailwind tokens. Values mirror src/theme/tokens.css (bg, fg, accent).
// Table layout and inline styles: the only markup every mail client agrees on.
const BG = "#0a0a0a";
const FG = "#ffffff";
const ACCENT = "#dee5a0";
const MUTED = "#8a8a8a";
const RULE = "#262626";
const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";
const SERIF = "'Instrument Serif',Georgia,'Times New Roman',serif";

const socialLinks = SOCIALS.map(
  ([name, url]) => `<a href="${url}" style="color:${FG};text-decoration:none;">${name}</a>`
).join(`<span style="color:${MUTED};">&nbsp;&nbsp;·&nbsp;&nbsp;</span>`);

const HTML = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="supported-color-schemes" content="dark">
<title>${SUBJECT}</title>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@1&family=Inter:wght@400;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${BG};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">Ya estás adentro: vas a ser de los primeros en escuchar lo nuevo del sello.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;font-family:${SANS};color:${FG};">

<tr><td style="padding:0 8px 28px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
<td valign="middle"><a href="${SITE_URL}"><img src="${ASSET_URL}/gaceta-word.png" width="115" height="20" alt="GACETA" style="display:block;border:0;"></a></td>
<td valign="middle" align="right" style="font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:${MUTED};">Heardle</td>
</tr></table>
</td></tr>

<tr><td style="border-top:1px solid ${RULE};font-size:0;line-height:0;">&nbsp;</td></tr>

<tr><td align="center" style="padding:48px 8px 8px;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" valign="middle" width="96" height="96" style="width:96px;height:96px;border:2px solid ${ACCENT};border-radius:50%;"><img src="${ASSET_URL}/gaceta-iso.png" width="44" height="44" alt="" style="display:block;border:0;margin:0 auto;"></td>
</tr></table>
</td></tr>

<tr><td align="center" style="padding:28px 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${ACCENT};">Novedades del sello</td></tr>

<tr><td align="center" style="padding:16px 8px 0;">
<h1 style="margin:0;font-family:${SANS};font-size:44px;line-height:1;font-weight:700;letter-spacing:-0.04em;color:${FG};">Gracias por<br><span style="font-family:${SERIF};font-style:italic;font-weight:400;letter-spacing:-0.01em;">sumarte.</span></h1>
</td></tr>

<tr><td align="center" style="padding:24px 24px 0;font-size:16px;line-height:1.55;color:${FG};">Jugaste al heardle de GACETA. Ahora vas a ser de los primeros en enterarte cuando salga música nueva del sello.</td></tr>

<tr><td align="center" style="padding:36px 8px 0;">
<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
<td align="center" bgcolor="${ACCENT}" style="background:${ACCENT};border-radius:2px;">
<a href="${GAME_URL}" style="display:inline-block;padding:16px 32px;font-family:${SANS};font-size:15px;font-weight:700;letter-spacing:-0.01em;color:${BG};text-decoration:none;">Jugá otra ronda &rarr;</a>
</td>
</tr></table>
</td></tr>

<tr><td align="center" style="padding:20px 8px 56px;font-size:14px;color:${MUTED};">Conocé el sello en <a href="${SITE_URL}" style="color:${FG};text-decoration:underline;">esgaceta.com</a></td></tr>

<tr><td style="border-top:1px solid ${RULE};font-size:0;line-height:0;">&nbsp;</td></tr>

<tr><td align="center" style="padding:32px 8px 0;font-family:${SERIF};font-style:italic;font-size:22px;color:${FG};">La escena, en primera plana.</td></tr>
<tr><td align="center" style="padding:16px 8px 0;font-size:12px;letter-spacing:0.05em;">${socialLinks}</td></tr>
<tr><td align="center" style="padding:28px 24px 0;font-size:12px;line-height:1.5;color:${MUTED};">Si no querés recibir más mails, respondé a este mail y te sacamos de la lista.</td></tr>
<tr><td align="center" style="padding:16px 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:${MUTED};">Made by GACETA</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

export function welcomeMessage(email) {
  return { from: FROM, reply_to: REPLY_TO, to: [email], subject: SUBJECT, html: HTML, text: TEXT };
}
