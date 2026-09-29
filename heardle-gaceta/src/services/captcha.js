/**
 * Cloudflare Turnstile (invisible widget), loaded with no npm dependency: a
 * `<script>` tag created at runtime, cached so the API only loads once per
 * page. Protects the anonymous sign-in in supabaseServices.js; Supabase
 * ignores the token until "CAPTCHA protection" is turned on in its dashboard,
 * so this has to keep working both before and after that switch.
 *
 * With no site key (`VITE_TURNSTILE_SITE_KEY` unset), `getCaptchaToken`
 * resolves `undefined` right away: dev/local keeps working without captcha.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const DEFAULT_TIMEOUT_MS = 15000;

let scriptPromise = null;

/** Whether a captcha should run at all. Separate so callers can branch on it without touching the DOM. */
export function isCaptchaConfigured(siteKey) {
  return Boolean(siteKey);
}

/**
 * Turnstile render() options wired to settle one token exchange. Kept apart
 * from the script/DOM side so the wiring itself is testable in node.
 */
export function buildRenderOptions(siteKey, { resolve, reject }) {
  return {
    sitekey: siteKey,
    size: "invisible",
    retry: "never",
    callback: (token) => resolve(token),
    "error-callback": () => reject(new Error("Turnstile no pudo verificar la sesión.")),
    "timeout-callback": () => reject(new Error("Turnstile tardó demasiado en responder.")),
  };
}

function loadTurnstileScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Turnstile needs a browser"));
  }
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error("El script de Turnstile cargó sin exponer window.turnstile."));
    };
    script.onerror = () => reject(new Error("No se pudo cargar el script de Turnstile."));
    document.head.appendChild(script);
  }).catch((error) => {
    // Let a later call try loading the script again instead of staying broken forever.
    scriptPromise = null;
    throw error;
  });

  return scriptPromise;
}

/**
 * Zero-size, off-layout container for the invisible widget. The app never
 * scrolls (see CLAUDE.md, "Layout: una sola pantalla"): this must not take
 * any height. Cloudflare renders its own visible challenge, if one is ever
 * needed, as a fixed overlay independent of this container.
 */
function createHiddenContainer() {
  const container = document.createElement("div");
  container.style.cssText = "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none;";
  document.body.appendChild(container);
  return container;
}

/**
 * Resolves a single-use Turnstile token, or `undefined` when no site key is
 * configured. The widget and its container are removed after use whether it
 * succeeds, fails, or times out — a Turnstile token is single-use, so callers
 * that retry must call this again for a fresh one.
 */
export async function getCaptchaToken(siteKey, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  if (!isCaptchaConfigured(siteKey)) return undefined;

  // One deadline covers loading the script too: a script request that never
  // settles would otherwise hang the sign-in forever.
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Turnstile no respondió en ${timeoutMs} ms.`)), timeoutMs);
  });
  let turnstile;
  let container;
  let widgetId;

  try {
    turnstile = await Promise.race([loadTurnstileScript(), deadline]);
    container = createHiddenContainer();
    return await Promise.race([
      new Promise((resolve, reject) => {
        widgetId = turnstile.render(container, buildRenderOptions(siteKey, { resolve, reject }));
      }),
      deadline,
    ]);
  } finally {
    clearTimeout(timer);
    if (widgetId !== undefined) turnstile.remove(widgetId);
    container?.remove();
  }
}
