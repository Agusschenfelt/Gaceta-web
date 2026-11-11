/**
 * Errors a round or the board can end in, by the code the rounds API sends
 * (api/_lib/http.js) or the local service mirrors. Only a real fetch
 * failure becomes `network`, the one error worth retrying; anything else
 * unrecognised is `unexpected`.
 */
export const ROUND_ERRORS = Object.freeze({
  not_authenticated: "No pudimos conectarte. Recargá la página.",
  rate_limited: "Jugaste muchas rondas seguidas. Esperá un rato y volvé.",
  empty_pool: "No hay temas para esa selección.",
  round_not_found: "Esa ronda ya no está. Recargá la página.",
  unknown_track: "Ese tema no está en el catálogo.",
  invalid_filter: "Esa selección de artistas no es válida.",
  invalid_level: "Ese nivel no es válido.",
  invalid_attempt: "No pudimos registrar el intento. Recargá la página.",
  invalid_email: "Revisá el mail.",
  captcha_failed: "No pudimos verificar que no sos un robot. Probá de nuevo.",
  local_unavailable: "Falta configurar el juego (el servidor de rondas o AUDIO_KEY_SECRET).",
  network: "No pudimos conectar. Probá de nuevo.",
  unexpected: "Algo salió mal. Probá de nuevo en un rato.",
});

export class RoundError extends Error {
  constructor(code, cause) {
    super(Object.hasOwn(ROUND_ERRORS, code) ? ROUND_ERRORS[code] : ROUND_ERRORS.unexpected);
    this.name = "RoundError";
    this.code = Object.hasOwn(ROUND_ERRORS, code) ? code : "unexpected";
    if (cause) this.cause = cause;
  }
}

/** Reads the round error code out of whatever a call failed with. */
export function toRoundError(error) {
  if (error instanceof RoundError) return error;
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`;
  const code = Object.keys(ROUND_ERRORS).find((c) => text.includes(c));
  if (code) return new RoundError(code, error);
  // Only a failed request is a connection problem worth retrying; anything
  // else (a server bug, a refused call) would fail the same way again.
  return new RoundError(isConnectionFailure(error, text) ? "network" : "unexpected", error);
}

function isConnectionFailure(error, text) {
  if (error instanceof TypeError) return true; // fetch() rejects with TypeError
  if (error?.status === 0) return true;
  return /failed to fetch|network|load failed|timeout|timed out/i.test(text);
}

/**
 * Maps the `{ error }` code of the round API (api/_lib/http.js). Codes the
 * browser has no copy for (`invalid_request`, `payload_too_large`,
 * `method_not_allowed`: a client bug, not something the player can fix) fall
 * to `unexpected`.
 */
export function fromApiError(code) {
  // `network` is reserved for real fetch failures: a server must not be able
  // to make the client retry by sending it.
  const known = typeof code === "string" && code !== "network" && Object.hasOwn(ROUND_ERRORS, code);
  return new RoundError(known ? code : "unexpected");
}
