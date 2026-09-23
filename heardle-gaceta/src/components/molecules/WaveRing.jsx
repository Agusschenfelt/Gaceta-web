import { useMemo, useState } from "react";
import { ringTicks, RING_TICKS } from "../../audio/waveform.js";

/* Ring geometry, in viewBox units. Ticks grow outwards from TICK_BASE. */
const SIZE = 100;
const CENTER = SIZE / 2;
const TICK_BASE = 37;
const TICK_REACH = 12;
const TICK_WIDTH = 1.5;

/** Radius of whatever sits inside the ring, as a share of the ring's box. */
export const INNER_RATIO = 0.66;

/** Delay between two neighbouring ticks of an unlock sweep. */
const SWEEP_STEP_MS = 14;

/** One lap of the idle shimmer running through the locked ticks. */
const SHIMMER_MS = 2600;

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
 * The song as a ring: `span` seconds of the track's own loudness envelope,
 * drawn as radial ticks clockwise from twelve.
 *
 * - The first `unlocked` ticks are lit, the rest wait dim. When `unlocked`
 *   grows, the new ticks sweep on (dim → acid gold → white).
 * - The first `lit` ticks are acid gold: the playhead while it plays, or the
 *   part the player needed on the reveal.
 * - `shimmer` runs a slow light through the locked ticks, outwards from the
 *   unlocked edge: there is more song here, press play.
 *
 * Shared by the play button and the reveal so both screens speak one motif.
 */
export function WaveRing({ peaks, span, unlocked, lit = 0, shimmer = false, loading = false }) {
  const ticks = useMemo(() => ringTicks(peaks, span), [peaks, span]);

  // The ticks that just became playable, for the sweep. Derived during render
  // (not in an effect) so the sweep starts on the same frame as the unlock. A
  // ring that shrinks means a new round: it sweeps on from the top again.
  const [sweep, setSweep] = useState({ from: 0, to: unlocked });
  if (sweep.to !== unlocked) {
    setSweep({ from: unlocked > sweep.to ? sweep.to : 0, to: unlocked });
  }

  const shimmerStep = SHIMMER_MS / RING_TICKS;

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {/* The ring itself reports loading, so it costs no layout height. */}
      <g className={loading ? "animate-[ring-pulse_1.4s_ease-in-out_infinite]" : undefined}>
        {ticks.map((length, i) => {
          const open = i < unlocked;
          const sweeping = open && i >= sweep.from && i < sweep.to;
          const shimmering = !open && shimmer && !loading;
          return (
            <line
              key={i}
              {...tickLine(i, length)}
              strokeWidth={TICK_WIDTH}
              className={sweeping ? "tick-unlock" : shimmering ? "tick-shimmer" : undefined}
              style={{
                stroke: !open
                  ? "var(--color-border)"
                  : i < lit
                    ? "var(--color-accent)"
                    : "var(--color-fg)",
                animationDelay: sweeping
                  ? `${(i - sweep.from) * SWEEP_STEP_MS}ms`
                  : shimmering
                    ? `${(i - unlocked) * shimmerStep}ms`
                    : undefined,
              }}
            />
          );
        })}
      </g>
    </svg>
  );
}
