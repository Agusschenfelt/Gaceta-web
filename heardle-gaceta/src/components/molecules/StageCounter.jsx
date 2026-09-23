function formatSeconds(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

/**
 * The seconds carry the whole tension of the round, so they get the system's
 * display voice rather than a caption. The unit stays small and muted so the
 * number is what you read.
 */
export function StageCounter({ seconds, stageIndex, total }) {
  return (
    <div className="flex flex-col gap-0.5" aria-live="polite">
      <span className="headline !leading-none text-[3.5rem] tabular-nums">
        {/* Keyed by the value so every new stage rolls in instead of swapping. */}
        <span key={seconds} className="roll-in">
          {formatSeconds(seconds)}
        </span>
        <span className="ml-1 align-baseline text-xl tracking-normal text-muted">s</span>
      </span>
      <span className="label">
        Intento {stageIndex + 1} de {total}
      </span>
    </div>
  );
}
