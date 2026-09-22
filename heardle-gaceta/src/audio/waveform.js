/**
 * Turns a precomputed loudness envelope into bar heights for the play circle.
 *
 * Pure on purpose: the visualiser is the one part of the audio feature that can
 * be tested without a browser, so all of its logic lives here and the component
 * only paints what this returns.
 *
 * Envelopes come from `scripts/build-peaks.mjs` as 0..255 values spanning the
 * whole clip file.
 */

export const BAR_COUNT = 5;

/** Bars never fully collapse; a dead bar reads as a broken component. */
const MIN_HEIGHT = 0.18;

/** Envelope value at a moment, 0..1. Returns 0 when there is nothing to read. */
export function levelAt(peaks, time, duration) {
  if (!peaks?.length || !(duration > 0) || !(time >= 0)) return 0;
  const ratio = Math.min(time / duration, 0.999999);
  const index = Math.floor(ratio * peaks.length);
  return (peaks[index] ?? 0) / 255;
}

/**
 * A short window of the envelope centred on `time`, so the bars read as the
 * waveform scrolling past rather than every bar moving as one.
 */
export function barHeights(peaks, time, duration, barCount = BAR_COUNT) {
  if (!peaks?.length || !(duration > 0)) {
    return Array.from({ length: barCount }, () => MIN_HEIGHT);
  }
  const step = duration / peaks.length;
  const middle = (barCount - 1) / 2;
  return Array.from({ length: barCount }, (_, i) => {
    const offset = (i - middle) * step;
    const level = levelAt(peaks, Math.max(time + offset, 0), duration);
    return MIN_HEIGHT + level * (1 - MIN_HEIGHT);
  });
}

/**
 * Length of every clip file, in seconds. Mirrors `CLIP_SECONDS` in
 * `scripts/compress-audio.mjs`: the envelope spans the whole file, so mapping a
 * moment to a bucket needs to know how long that file is.
 */
export const CLIP_FILE_SECONDS = 16;

/** Ticks around the play circle. */
export const RING_TICKS = 64;

/** Shortest tick, so a quiet stretch still draws the ring's outline. */
const MIN_TICK = 0.12;

/**
 * The first `span` seconds of the envelope as tick lengths for the ring, 0..1.
 *
 * Interpolated between buckets so neighbouring ticks do not repeat in pairs,
 * and normalised against the loudest moment inside the span rather than the
 * whole file: the ring only shows the start of the song, and a quiet intro
 * should still fill it.
 */
export function ringTicks(peaks, span, count = RING_TICKS, fileSeconds = CLIP_FILE_SECONDS) {
  if (!peaks?.length || !(span > 0) || !(fileSeconds > 0)) {
    return Array.from({ length: count }, () => MIN_TICK);
  }
  const last = peaks.length - 1;
  const raw = Array.from({ length: count }, (_, i) => {
    // Centre of this tick's slice, as a fractional bucket index.
    const time = ((i + 0.5) / count) * span;
    const position = Math.min((time / fileSeconds) * peaks.length - 0.5, last);
    const lower = Math.max(Math.floor(position), 0);
    const upper = Math.min(lower + 1, last);
    const weight = Math.max(position - lower, 0);
    return (peaks[lower] ?? 0) * (1 - weight) + (peaks[upper] ?? 0) * weight;
  });
  const loudest = Math.max(...raw);
  if (!(loudest > 0)) return raw.map(() => MIN_TICK);
  return raw.map((value) => MIN_TICK + (value / loudest) * (1 - MIN_TICK));
}

/** How many of `count` ticks spanning `span` seconds fall inside the first `seconds`. */
export function unlockedTicks(seconds, span, count = RING_TICKS) {
  if (!(span > 0) || !(seconds > 0)) return 0;
  return Math.min(Math.round((seconds / span) * count), count);
}
