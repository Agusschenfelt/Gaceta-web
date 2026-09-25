/**
 * Loads public/catalog/index.json and every artist file it lists, then merges
 * tracks into one pool deduplicated by ISRC. A track featured across several
 * artists keeps every artist slug so the artist filter can find it.
 */
const BASE = `${import.meta.env.BASE_URL}catalog`;

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo cargar ${url} (${res.status})`);
  return res.json();
}

export async function loadCatalog() {
  const index = await fetchJson(`${BASE}/index.json`);
  const listed = index.map(({ slug, name }) => ({ slug, name }));

  // One unreachable artist file used to take the whole catalog down. Play with
  // whatever resolved instead, and drop the artists that did not: keeping their
  // chip would offer a selection with no tracks behind it.
  const settled = await Promise.allSettled(
    listed.map((a) => fetchJson(`${BASE}/${a.slug}.json`)),
  );

  const loaded = [];
  listed.forEach((artist, i) => {
    const result = settled[i];
    if (result.status === "fulfilled") {
      loaded.push({ artist, file: result.value });
    } else {
      console.warn(`Catálogo: no se pudo cargar ${artist.slug}`, result.reason);
    }
  });

  if (loaded.length === 0) {
    throw new Error("No se pudo cargar ningún artista del catálogo");
  }

  const artists = loaded.map(({ artist }) => artist);

  const byId = new Map();
  loaded.forEach(({ artist, file }) => {
    const slug = artist.slug;
    for (const t of file.tracks) {
      const existing = byId.get(t.id);
      if (existing) {
        if (!existing.artistSlugs.includes(slug)) existing.artistSlugs.push(slug);
        continue;
      }
      byId.set(t.id, {
        id: t.id,
        title: t.title,
        artists: t.artists?.length ? t.artists : [t.artist],
        artistSlugs: [slug],
        // Only present in local mode (no AUDIO_KEY_SECRET): with the secret the
        // catalog never says which audio is which track. See publish-assets.mjs.
        audioKey: t.audio_key ?? null,
        coverUrl: t.cover_url,
        spotifyUrl: t.spotify_url,
        release: t.release,
        releaseDate: t.release_date,
      });
    }
  });

  return { artists, tracks: [...byId.values()] };
}

/**
 * Waveform envelopes, loaded on their own.
 *
 * They are half the catalog's transfer and pure decoration, so they must never
 * sit between the player and the first round: fetch this alongside the catalog,
 * not inside it. A failure resolves to an empty map and the bars stay flat.
 */
export async function loadPeaks(url = `${BASE}/peaks.json`) {
  try {
    return await fetchJson(url);
  } catch (err) {
    console.warn("Catálogo: sin envolventes de onda", err);
    return {};
  }
}

export function trackLabel(track) {
  return `${track.title} — ${track.artists.join(", ")}`;
}
