import { getCaptchaToken } from "../services/captcha.js";
import { RoundError, fromApiError } from "../rounds/roundErrors.js";

/**
 * The email opt-in over the Vercel Function in api/subscribe.js. The server
 * verifies the Turnstile token and stores the address; this side only fetches
 * the token and maps failures.
 *
 * `fetch`, `captcha` and `siteKey` are injected for tests.
 */
export function createApiAdapter({
  fetch = globalThis.fetch?.bind(globalThis),
  captcha = getCaptchaToken,
  siteKey = import.meta.env?.VITE_TURNSTILE_SITE_KEY,
  baseUrl = "",
} = {}) {
  return {
    name: "api",

    async subscribeEmail(email) {
      let captchaToken;
      try {
        captchaToken = await captcha(siteKey);
      } catch (cause) {
        throw new RoundError("captcha_failed", cause);
      }

      let response;
      let data;
      try {
        response = await fetch(`${baseUrl}/api/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, captchaToken }),
        });
        data = await response.json();
      } catch (cause) {
        throw new RoundError("network", cause);
      }
      if (!response.ok || data?.error) throw fromApiError(data?.error);
    },
  };
}
