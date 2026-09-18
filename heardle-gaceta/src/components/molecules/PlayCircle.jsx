/**
 * The GACETA isotype is a folded G that already reads as a play triangle, so
 * the button's affordance and the label's mark are the same shape. Painted as a
 * CSS mask rather than an `<img>` so it takes `currentColor` from the tokens
 * and follows the disabled and loading states.
 */
const ISOTYPE_MASK = {
  maskImage: "url(/assets/gaceta-iso.png)",
  WebkitMaskImage: "url(/assets/gaceta-iso.png)",
  maskSize: "contain",
  WebkitMaskSize: "contain",
  maskRepeat: "no-repeat",
  WebkitMaskRepeat: "no-repeat",
  maskPosition: "center",
  WebkitMaskPosition: "center",
};

const SIZE = 100;
const STROKE = 2;
const R = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * R;

/**
 * The elastic element of the game screen. It takes the height its parent has
 * left over and derives its width from that, so a shorter viewport, an open
 * settings panel or a growing attempt history all resolve by shrinking the
 * circle instead of pushing the layout into a scroll.
 *
 * `aspect-square` with `h-full` and `max-w-full` settles at
 * min(available height, available width), keeping the ring perfectly round.
 */
/**
 * Read once: a viewer who asked for less motion should not get bars jumping
 * every frame. Toggling the OS setting mid-session is rare enough that a
 * listener would cost more than it buys here.
 */
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function PlayCircle({
  isPlaying,
  progress,
  disabled,
  loading = false,
  levels = [],
  onPlay,
}) {
  const offset = CIRC * (1 - progress);
  const label = isPlaying
    ? "Reproduciendo"
    : loading
      ? "Cargando el fragmento"
      : "Escuchar fragmento";
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-label={label}
      className="group relative aspect-square h-full max-h-96 w-auto max-w-full rounded-full transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full -rotate-90">
        {/* The ring itself reports loading, so it costs no layout height. */}
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={STROKE}
          className={loading ? "animate-[ring-pulse_1.4s_ease-in-out_infinite]" : undefined}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={STROKE}
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="butt"
        />
      </svg>
      <span className="absolute inset-[6%] rounded-full bg-surface transition-colors group-hover:bg-border" />
      <span className="absolute inset-0 flex items-center justify-center">
        {isPlaying ? (
          /* These bars used to be a CSS keyframe pretending to follow the
             music. They now read the track's own envelope, so the circle moves
             with what you are actually hearing. */
          <span className="flex h-[24%] w-[30%] items-end justify-center gap-[5%]" aria-hidden="true">
            {levels.map((height, i) => (
              /* scaleY, not height: five bars changing height at 60fps would
                 force layout every frame. */
              <span
                key={i}
                className="h-full flex-1 origin-bottom bg-fg"
                style={{
                  transform: `scaleY(${REDUCED_MOTION ? 0.55 : height})`,
                  transition: REDUCED_MOTION ? undefined : "transform 90ms linear",
                }}
              />
            ))}
          </span>
        ) : (
          <span
            aria-hidden="true"
            style={ISOTYPE_MASK}
            className={`aspect-square w-[30%] bg-fg transition-opacity ${loading ? "opacity-40" : ""}`}
          />
        )}
      </span>
    </button>
  );
}
