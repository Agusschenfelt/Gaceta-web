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
