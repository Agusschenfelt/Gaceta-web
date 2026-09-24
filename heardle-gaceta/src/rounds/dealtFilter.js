/**
 * Which artist filter a round was dealt from, or null when it is unknown.
 *
 * `start()` hands back the open round instead of dealing a new one, so the
 * round it returns may predate this request (a reload, a start that failed
 * after the server had already dealt). Rounds are not tagged with their filter,
 * so the browser remembers it per round id when it deals one.
 *
 * - `remembered` is that `{ roundId, filter }`, when it matches this round.
 * - A round that already has attempts was dealt before this request, from a
 *   filter this browser no longer knows: null, never a guess.
 * - Otherwise the round was just dealt from `requested`.
 */
export function resolveDealtFilter(round, requested, remembered) {
  if (remembered && remembered.roundId === round.id) return remembered.filter;
  if (round.attempts.length > 0) return null;
  return requested;
}
