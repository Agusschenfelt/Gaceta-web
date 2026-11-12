/**
 * Whether the settings the player has chosen only apply from the next round.
 *
 * A round is dealt once and never rerolled, so changing the artist chips or the
 * level while one is open does not touch it.
 *
 * - `dealtFilter` is the artist filter the open round came from, or null when
 *   unknown (see dealtFilter.js): an unknown filter never counts as a change.
 * - `round.level` is absent on a round that does not carry its level: no change.
 */
export function hasPendingNextRound({ round, dealtFilter, artistFilter, level }) {
  if (!round) return false;
  const filterChanged =
    Boolean(dealtFilter) &&
    !(
      dealtFilter.length === artistFilter.length &&
      dealtFilter.every((x) => artistFilter.includes(x))
    );
  const levelChanged = Boolean(round.level) && round.level !== level;
  return filterChanged || levelChanged;
}
