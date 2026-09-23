/**
 * The finished round's track: from the catalog when this browser has it, else
 * from what the judge returned (`round.answer`), so the reveal never depends on
 * a catalog file having loaded.
 */
export function answerTrack(round, tracksById, artists) {
  const known = tracksById.get(round.answerId);
  if (known) return known;
  const names = new Map(artists.map((a) => [a.slug, a.name]));
  return {
    id: round.answerId,
    title: round.answer?.title ?? "Tema del catálogo",
    artists: (round.answer?.artistSlugs ?? []).map((slug) => names.get(slug) ?? slug),
    coverUrl: null,
    spotifyUrl: null,
  };
}
