import { useEffect, useId, useMemo, useRef, useState } from "react";
import { search } from "../../catalog/search.js";
import { trackLabel } from "../../catalog/loadCatalog.js";
import { TextInput } from "../atoms/TextInput.jsx";

export function GuessSearch({ tracks, disabled, onSelect }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const inputRef = useRef(null);

  const results = useMemo(() => search(query, tracks), [query, tracks]);

  useEffect(() => {
    setActive(results.length ? 0 : -1);
  }, [results]);

  /**
   * `onSelect` returns false when it could not take the guess (another one is
   * still on its way): the text stays, so the pick is not lost and can be
   * confirmed again a moment later.
   */
  function choose(track) {
    if (onSelect(track) === false) {
      inputRef.current?.focus();
      return;
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onKeyDown(e) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) choose(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && query.trim().length > 0;

  return (
    <div className="relative w-full">
      <TextInput
        ref={inputRef}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        placeholder="Buscá el tema o el artista"
        autoComplete="off"
        disabled={disabled}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          /* Opens upward: the input sits near the bottom of a viewport-height frame. */
          className="absolute bottom-full left-0 right-0 z-10 mb-1 max-h-[40svh] overflow-y-auto overscroll-contain rounded border border-border bg-bg"
        >
          {results.length === 0 && (
            <li className="px-4 py-3 text-sm text-muted">No encontramos ese tema</li>
          )}
          {results.map((t, i) => (
            <li
              key={t.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => e.preventDefault()}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(t)}
              className={`cursor-pointer px-4 py-3 text-sm ${
                i === active ? "bg-surface text-fg" : "text-muted"
              }`}
            >
              {trackLabel(t)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
