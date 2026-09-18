export const MAX_RESULTS = 8;

export function normalize(text) {
  return (text ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ranks: title starts with query > title contains > artist contains.
 * Returns at most MAX_RESULTS tracks.
 */
export function search(query, tracks) {
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const t of tracks) {
    const title = normalize(t.title);
    const artists = normalize(t.artists.join(" "));
    let rank = null;
    if (title.startsWith(q)) rank = 0;
    else if (title.includes(q)) rank = 1;
    else if (artists.includes(q)) rank = 2;
    else if (`${title} ${artists}`.includes(q)) rank = 3;
    if (rank !== null) scored.push({ rank, t });
  }
  scored.sort((a, b) => a.rank - b.rank || a.t.title.localeCompare(b.t.title));
  return scored.slice(0, MAX_RESULTS).map((s) => s.t);
}
