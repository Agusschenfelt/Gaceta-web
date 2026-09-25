import { useEffect, useState } from "react";

/**
 * Breakpoints in JS go through matchMedia, never a resize listener.
 *
 * Used to move whole blocks between layouts rather than to hide duplicates with
 * CSS: two copies of the attempt list in the DOM would mean two elements with
 * the same aria-label, which is worse than a re-render.
 */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (event) => setMatches(event.matches);
    setMatches(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
