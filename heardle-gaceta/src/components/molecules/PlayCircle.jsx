import { useMemo, useState } from "react";
import { ringTicks, unlockedTicks, RING_TICKS } from "../../audio/waveform.js";

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

/* Ring geometry, in viewBox units. Ticks grow outwards from TICK_BASE. */
const SIZE = 100;
const CENTER = SIZE / 2;
const TICK_BASE = 37;
const TICK_REACH = 12;
const TICK_WIDTH = 1.5;
const DISC_R = 33;

/** Delay between two neighbouring ticks of an unlock sweep. */
const SWEEP_STEP_MS = 14;

/**
 * Read once: a viewer who asked for less motion should not get the isotype
 * pumping every frame. Toggling the OS setting mid-session is rare enough that
 * a listener would cost more than it buys here.
 */
const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

function tickLine(i, length) {
  // Clockwise from twelve o'clock, like the song reads.
  const angle = ((i + 0.5) / RING_TICKS) * 2 * Math.PI - Math.PI / 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const outer = TICK_BASE + length * TICK_REACH;
  return {
    x1: CENTER + TICK_BASE * cos,
    y1: CENTER + TICK_BASE * sin,
    x2: CENTER + outer * cos,
    y2: CENTER + outer * sin,
  };
}

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
  const ticks = useMemo(() => ringTicks(peaks, span), [peaks, span]);
  const unlocked = unlockedTicks(seconds, span);
  const played = isPlaying ? (progress * seconds * RING_TICKS) / span : 0;

  // The ticks that just became playable, for the sweep. Derived during render
  // (not in an effect) so the sweep starts on the same frame as the unlock. A
  // ring that shrinks means a new round: it sweeps on from the top again.
  const [sweep, setSweep] = useState({ from: 0, to: unlocked });
  if (sweep.to !== unlocked) {
    setSweep({ from: unlocked > sweep.to ? sweep.to : 0, to: unlocked });
  }

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
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={DISC_R}
          strokeWidth={0.4}
          className="fill-bg stroke-border transition-colors duration-200 group-hover:fill-surface"
        />
        {/* The ring itself reports loading, so it costs no layout height. */}
        <g className={loading ? "animate-[ring-pulse_1.4s_ease-in-out_infinite]" : undefined}>
          {ticks.map((length, i) => {
            const open = i < unlocked;
            const sweeping = open && i >= sweep.from && i < sweep.to;
            return (
              <line
                key={i}
                {...tickLine(i, length)}
                strokeWidth={TICK_WIDTH}
                className={sweeping ? "tick-unlock" : undefined}
                style={{
                  stroke: !open
                    ? "var(--color-border)"
                    : i < played
                      ? "var(--color-accent)"
                      : "var(--color-fg)",
                  animationDelay: sweeping ? `${(i - sweep.from) * SWEEP_STEP_MS}ms` : undefined,
                }}
              />
            );
          })}
        </g>
      </svg>
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
