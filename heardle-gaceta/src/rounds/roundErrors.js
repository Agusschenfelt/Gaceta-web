/**
 * Errors a round or the board can end in, by the code the database raises
 * (supabase/schema.sql) or the local service mirrors. Anything unrecognised is
 * treated as a connection problem, which is what it almost always is.
 */
export const ROUND_ERRORS = Object.freeze({
  not_authenticated: "No pudimos conectarte. Recargá la página.",
  rate_limited: "Jugaste muchas rondas seguidas. Esperá un rato y volvé.",
  empty_pool: "No hay temas para esa selección.",
  round_not_found: "Esa ronda ya no está. Recargá la página.",
  unknown_track: "Ese tema no está en el catálogo.",
  invalid_filter: "Esa selección de artistas no es válida.",
  invalid_attempt: "No pudimos registrar el intento. Recargá la página.",
  invalid_alias: "El alias va de 2 a 16 letras, números, espacios, puntos o guiones.",
  blocked_alias: "Elegí otro alias.",
  alias_taken: "Ese alias ya está en uso.",
  invalid_email: "Revisá el mail.",
  local_unavailable: "Falta configurar el juego (Supabase o AUDIO_KEY_SECRET).",
  network: "No pudimos conectar. Probá de nuevo.",
  unexpected: "Algo salió mal. Probá de nuevo en un rato.",
});

export class RoundError extends Error {
  constructor(code, cause) {
    super(ROUND_ERRORS[code] ?? ROUND_ERRORS.unexpected);
    this.name = "RoundError";
    this.code = code in ROUND_ERRORS ? code : "unexpected";
    if (cause) this.cause = cause;
  }
}

/** Reads the code out of whatever a Supabase call failed with. */
export function toRoundError(error) {
  if (error instanceof RoundError) return error;
  const text = `${error?.message ?? ""} ${error?.details ?? ""}`;
  // A session whose user was deleted still signs requests until it expires;
  // the database then refuses to register it as a player.
  if (text.includes("players_id_fkey")) return new RoundError("not_authenticated", error);
  const code = Object.keys(ROUND_ERRORS).find((c) => text.includes(c));
  if (code) return new RoundError(code, error);
  // Only a failed request is a connection problem worth retrying; anything
  // else (a server bug, a refused call) would fail the same way again.
  return new RoundError(isConnectionFailure(error, text) ? "network" : "unexpected", error);
}

function isConnectionFailure(error, text) {
  if (error instanceof TypeError) return true; // fetch() rejects with TypeError
  if (error?.name === "AuthRetryableFetchError" || error?.status === 0) return true;
  return /failed to fetch|network|load failed|timeout|timed out/i.test(text);
}
