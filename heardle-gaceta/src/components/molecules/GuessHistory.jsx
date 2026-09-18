import { trackLabel } from "../../catalog/loadCatalog.js";
import { Icon } from "../atoms/Icon.jsx";

/**
 * Compact on purpose: every row here is height the play circle gives up, and a
 * Fácil round can end with five of them.
 */
export function GuessHistory({ attempts, tracksById }) {
  if (attempts.length === 0) return null;
  return (
    <ol className="flex w-full shrink-0 flex-col gap-1" aria-label="Intentos anteriores">
      {attempts.map((a, i) => {
        const isSkip = a.type === "skip";
        const track = isSkip ? null : tracksById.get(a.trackId);
        const tone = isSkip ? "text-muted" : a.correct ? "text-accent" : "text-danger";
        return (
          <li
            key={i}
            className="fade-up flex items-center gap-2.5 rounded border border-border px-2.5 py-1.5 text-xs"
          >
            <Icon
              name={isSkip ? "skip" : a.correct ? "check" : "close"}
              size={13}
              className={`shrink-0 ${tone}`}
            />
            <span className={`truncate ${isSkip ? "text-muted" : "text-fg"}`}>
              {isSkip ? "Salteado" : track ? trackLabel(track) : a.trackId}
            </span>
            <span className="sr-only">
              {isSkip ? "salteado" : a.correct ? "correcto" : "incorrecto"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
