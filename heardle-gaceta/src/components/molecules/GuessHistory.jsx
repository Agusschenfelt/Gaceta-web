import { trackLabel } from "../../catalog/loadCatalog.js";
import { Icon } from "../atoms/Icon.jsx";

function formatSeconds(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

function attemptView(attempt, tracksById) {
  const isSkip = attempt.type === "skip";
  const track = isSkip ? null : tracksById.get(attempt.trackId);
  return {
    icon: isSkip ? "skip" : attempt.correct ? "check" : "close",
    tone: isSkip ? "text-muted" : attempt.correct ? "text-accent" : "text-danger",
    text: isSkip ? "Salteado" : track ? trackLabel(track) : attempt.trackId,
    textTone: isSkip ? "text-muted" : "text-fg",
    srText: isSkip ? "salteado" : attempt.correct ? "correcto" : "incorrecto",
  };
}

/**
 * The whole round as a ladder, for the wide layout's side column: every stage
 * is there from the first second, so the column is never empty and the player
 * can see how much song each miss is going to cost.
 */
function Ladder({ attempts, tracksById, stages, stageIndex }) {
  return (
    <ol className="flex w-full flex-col" aria-label="Intentos">
      {stages.map((seconds, i) => {
        const attempt = attempts[i];
        const view = attempt ? attemptView(attempt, tracksById) : null;
        const isCurrent = !attempt && i === stageIndex;
        return (
          <li
            key={i}
            className="flex min-w-0 items-baseline gap-3 border-b border-border py-2.5 last:border-b-0"
          >
            <span
              className={`headline w-12 shrink-0 text-2xl !leading-none tabular-nums transition-colors ${
                isCurrent ? "text-fg" : attempt ? "text-muted" : "text-muted opacity-60"
              }`}
            >
              {formatSeconds(seconds)}
              <span className="ml-0.5 text-xs tracking-normal">s</span>
            </span>
            {view ? (
              <span className="fade-up flex min-w-0 items-center gap-2 text-xs">
                <Icon name={view.icon} size={13} className={`shrink-0 ${view.tone}`} />
                <span className={`truncate ${view.textTone}`}>{view.text}</span>
                <span className="sr-only">{view.srText}</span>
              </span>
            ) : isCurrent ? (
              <span className="rise flex items-center gap-2">
                {/* One tick of the ring, in the colour of the playhead. */}
                <span aria-hidden="true" className="h-3 w-[3px] bg-accent" />
                <span className="label !text-fg">Ahora</span>
              </span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Compact on purpose: every row here is height the play circle gives up.
 * `variant="ladder"` is the wide layout's column, where height is free.
 */
export function GuessHistory({ attempts, tracksById, stages, stageIndex, variant = "list" }) {
  if (variant === "ladder") {
    return (
      <Ladder attempts={attempts} tracksById={tracksById} stages={stages} stageIndex={stageIndex} />
    );
  }
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
