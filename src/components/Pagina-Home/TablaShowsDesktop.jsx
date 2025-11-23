// ShowsByArtist.jsx
import React, { useMemo } from "react";

/**
 * Espera un array de shows con esta forma:
 * {
 *   id: "r-2025-05-27",
 *   artist: "Ramma",               // clave para agrupar
 *   date: "2025-05-27",            // ISO (recomendado) o "27/05/2025"
 *   city: "Buenos Aires",
 *   countryFlag: "🇦🇷",
 *   venue: "Groove",
 *   ticketsUrl: "https://…",       // opcional
 *   soldOut: false                 // boolean
 * }
 *
 * Props:
 * - shows: Show[]
 * - videoSrc?: string  (opcional, fondo video)
 * - title?: string     (opcional, ej. "Gira 2025")
 */

export default function ShowsByArtist({ shows = [], videoSrc, title = "Shows" }) {
  // --- Helpers ---
  const parseDate = (d) => {
    // Soporta ISO o dd/mm(/yyyy)
    if (!d) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(d)) return new Date(d);
    const m = d.match(/^(\d{1,2})[/-](\d{1,2})([/-](\d{2,4}))?$/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      const year = m[3] ? parseInt(m[3].replace(/[/-]/, ""), 10) : new Date().getFullYear();
      return new Date(year, month, day);
    }
    return new Date(d); // fallback
  };

  const fmtDDMM = (date) =>
    date ? `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}` : "";

  // 1) Agrupo por artista
  const groups = useMemo(() => {
    const map = new Map(); // artist -> shows[]
    for (const show of shows) {
      const key = show.artist || "Sin artista";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(show);
    }
    // 2) Ordeno los grupos por nombre de artista (opcional)
    const ordered = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
    // 3) Ordeno los shows dentro de cada artista por fecha asc
    return ordered.map(([artist, arr]) => {
      const sorted = arr
        .map((s) => ({ ...s, _dt: parseDate(s.date) }))
        .sort((a, b) => (a._dt?.getTime() || 0) - (b._dt?.getTime() || 0));
      return { artist, shows: sorted };
    });
  }, [shows]);

  return (
    <section className="relative">
      {/* Fondo de video opcional */}
      {videoSrc && (
        <>
          <video
            className="pointer-events-none fixed inset-0 h-full w-full object-cover"
            src={videoSrc}
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="fixed inset-0 bg-black/60" /> {/* overlay para contraste */}
        </>
      )}

      {/* Contenido */}
      <div className={`relative ${videoSrc ? "min-h-[100svh]" : ""}`}>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-8 py-16">
          <header className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">{title}</h2>
          </header>

          {/* Secciones por artista */}
          <div className="space-y-12">
            {groups.map(({ artist, shows }) => (
              <ArtistBlock key={artist} artist={artist} shows={shows} fmtDDMM={fmtDDMM} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ArtistBlock({ artist, shows, fmtDDMM }) {
  return (
    <section aria-labelledby={`artist-${artist}`} className="backdrop-blur-sm">
      {/* Título de artista como “sección” */}
      <h3
        id={`artist-${artist}`}
        className="mb-3 text-white/90 text-xl sm:text-2xl font-semibold tracking-wide"
      >
        {artist}
      </h3>

      {/* “Tabla” minimalista con líneas (estilo referencia) */}
      <ul className="divide-y divide-white/15 border-y border-white/20">
        {shows.map((s) => {
          const date = s._dt instanceof Date ? s._dt : null;
          const isSold = Boolean(s.soldOut);
          return (
            <li
              key={s.id || `${artist}-${s.date}-${s.city}-${s.venue}`}
              className="group flex items-center gap-4 py-4 sm:py-5 text-white hover:bg-white/5 transition-colors"
            >
              {/* Fecha grande a la izquierda */}
              <div className="w-20 shrink-0 tabular-nums text-lg sm:text-2xl font-medium tracking-wide">
                {fmtDDMM(date)}
              </div>

              {/* Ciudad + País */}
              <div className="min-w-0 flex-1 text-base sm:text-xl font-medium">
                <span className="truncate">
                  {s.city} {s.countryFlag ? <span className="opacity-80">{s.countryFlag}</span> : null}
                </span>
              </div>

              {/* Venue (truncado si es largo) */}
              <div className="hidden md:block w-[28%] text-sm sm:text-base text-white/80 truncate">
                {s.venue}
              </div>

              {/* Acción */}
              <div className="w-32 sm:w-36 flex justify-end">
                {isSold ? (
                  <span className="text-red-400/90 line-through tracking-wide select-none">SOLD OUT</span>
                ) : s.ticketsUrl ? (
                  <a
                    href={s.ticketsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/70 text-sm sm:text-base hover:bg-white hover:text-black transition-colors"
                  >
                    Entradas
                  </a>
                ) : (
                  <span className="text-white/60 text-sm sm:text-base">Próximamente</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
