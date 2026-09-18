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
