/**
 * How the board is ordered, as one pure function both adapters share. The
 * Supabase view in `supabase/schema.sql` implements the same rule in SQL, so a
 * change here has to be made there too.
 *
 * Players are ranked by their average points per game, not their total: a
 * total rewards whoever plays most, an average rewards whoever guesses best.
 * The minimum keeps one lucky first-listen round from topping the board.
 */
export const MIN_GAMES = 5;

/**
 * A round counts for the board only when dealt from every artist or from at
 * least this many. One artist with 9 songs makes guessing far easier, so those
 * rounds are played and scored but kept out of the average. Three because the
 * label's core artists are three (Ramma, ARA, Valuto) and people listen to all
 * of them. Same rule as `start_round` in supabase/schema.sql.
 */
export const MIN_ARTISTS_RANKED = 3;

/** Whether a selection of artist slugs deals ranked rounds. Empty means every artist. */
export function isRankedSelection(slugs, knownSlugs = null) {
  if (!slugs || slugs.length === 0) return true;
  const known = knownSlugs ? new Set(knownSlugs) : null;
  const real = new Set(slugs.filter((s) => !known || known.has(s)));
  return real.size >= MIN_ARTISTS_RANKED;
}

/**
 * Whether a dealt round counts for the board: the selection qualifies AND the
 * player has no earlier round (any status: won, lost, or a repeat of either)
 * with that same track. Losing reveals the answer, so replaying it is a free
 * 4-point round — only the first time a track is played can prove anything.
 * Same rule as `start_round` in supabase/schema.sql (`is_ranked`).
 */
export function isRankedRound(selectionRanked, alreadyPlayed) {
  return selectionRanked && !alreadyPlayed;
}

/** Per-player totals → the ordered board. Rows without an alias never show. */
export function rankPlayers(stats, minGames = MIN_GAMES) {
  return stats
    .filter((s) => s.alias && s.gamesPlayed >= minGames)
    .map((s) => ({
      alias: s.alias,
      gamesPlayed: s.gamesPlayed,
      totalScore: s.totalScore,
      avgScore: s.totalScore / s.gamesPlayed,
    }))
    .sort(
      (a, b) =>
        b.avgScore - a.avgScore ||
        // Same average: the one who proved it over more games goes first.
        b.gamesPlayed - a.gamesPlayed ||
        a.alias.localeCompare(b.alias)
    );
}

/** One player's own numbers, from their list of round scores. */
export function playerStats(scores) {
  const gamesPlayed = scores.length;
  const totalScore = scores.reduce((sum, s) => sum + s, 0);
  return { gamesPlayed, totalScore, avgScore: gamesPlayed ? totalScore / gamesPlayed : 0 };
}

/** Rounds still needed to appear on the board. */
export function gamesMissing(gamesPlayed, minGames = MIN_GAMES) {
  return Math.max(minGames - gamesPlayed, 0);
}
