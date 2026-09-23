import { unlockedTicks, RING_TICKS } from "../../audio/waveform.js";
import { WaveRing } from "./WaveRing.jsx";

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

/**
 * Read once: a viewer who asked for less motion should not get the isotype
 * pumping every frame. Toggling the OS setting mid-session is rare enough that
 * a listener would cost more than it buys here.
 */
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/**
 * The ring is the song. Its ticks are the first `span` seconds of the track's
 * own loudness envelope: the part the player has unlocked is lit, the rest
 * waits dim. Every miss unlocks more and the new ticks sweep on; while the clip
 * plays, the playhead turns the ticks it has passed acid gold and the isotype
 * beats with the level.
 *
 * It is also the elastic element of the game screen. It takes the height its
 * parent has left over and derives its width from that (`aspect-square` with
 * `h-full` and `max-w-full` settles at the smaller of the two), so a shorter
 * viewport or a growing attempt history shrinks the circle instead of
 * scrolling.
 */
export function PlayCircle({
  isPlaying,
  progress,
  disabled,
  loading = false,
  level = 0,
  peaks = null,
  seconds,
  span,
  onPlay,
}) {
  const unlocked = unlockedTicks(seconds, span);
  const played = isPlaying ? (progress * seconds * RING_TICKS) / span : 0;

  const beat = isPlaying && !REDUCED_MOTION ? 1 + level * 0.14 : 1;
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
      className="group relative aspect-square h-full max-h-[26rem] w-auto max-w-full rounded-full transition-transform duration-150 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
    >
      {/* The ring leans in on hover: the whole button is the target. */}
      <span className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03] group-disabled:scale-100">
        <WaveRing
          peaks={peaks}
          span={span}
          unlocked={unlocked}
          lit={played}
          loading={loading}
        />
      </span>
      <span className="absolute inset-[17%] rounded-full border border-border bg-bg transition-colors duration-200 group-hover:bg-surface" />
      <span className="absolute inset-0 flex items-center justify-center">
        <span
          aria-hidden="true"
          style={{
            ...ISOTYPE_MASK,
            // Scale, not size: nothing reflows while it beats.
            transform: `scale(${beat})`,
            transition: "transform 90ms linear",
          }}
          className={`aspect-square w-[28%] transition-colors ${
            isPlaying ? "bg-accent" : "bg-fg"
          } ${loading ? "opacity-40" : ""}`}
        />
      </span>
    </button>
  );
}
