import { useState } from "react";
import { Tag } from "../atoms/Tag.jsx";
import { Icon } from "../atoms/Icon.jsx";

/**
 * Two shapes for the same control:
 *
 * - `bar` (narrow screens): one summary line with a disclosure. The filter is
 *   touched once, so at rest it costs a single row, and opening it borrows
 *   height from the play circle.
 * - `panel` (wide screens): always open in the side column, where the space is
 *   free and hiding it would only add a click.
 */
export function GameSettings({ artists, selected, onChangeArtists, poolSize, variant = "bar" }) {
  const [open, setOpen] = useState(false);
  const all = selected.length === 0;

  const summary = all
    ? "Todos los artistas"
    : selected.length === 1
      ? (artists.find((a) => a.slug === selected[0])?.name ?? "1 artista")
      : `${selected.length} artistas`;

  function toggleArtist(slug) {
    const next = selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug];
    onChangeArtists(next.length === artists.length ? [] : next);
  }

  const chips = (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por artista">
      <Tag active={all} onClick={() => onChangeArtists([])}>
        Todos
      </Tag>
      {artists.map((a) => (
        <Tag key={a.slug} active={!all && selected.includes(a.slug)} onClick={() => toggleArtist(a.slug)}>
          {a.name}
        </Tag>
      ))}
    </div>
  );

  if (variant === "panel") {
    return (
      <div className="flex w-full flex-col gap-3">
        <span className="label">Artistas</span>
        {chips}
        <span className="label">{poolSize} temas en juego</span>
      </div>
    );
  }

  return (
    <div className="flex w-full shrink-0 flex-col">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full items-center justify-between gap-3 text-left text-muted transition-colors hover:text-fg"
      >
        <span className="label truncate">
          {summary} · {poolSize} temas
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          <span className="label">Artistas</span>
          <Icon
            name="chevronDown"
            className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      {open && <div className="fade-up pb-3 pt-1">{chips}</div>}
    </div>
  );
}
