/**
 * Finds where a preview actually starts making a sound.
 *
 * The first stage of a round is half a second long, so a preview that opens
 * with silence burns the player's first guess on nothing. This module is the
 * pure half of the fix: it takes decoded PCM and reports the offset to cut at.
 * Reading the file and re-encoding it belongs to compress-audio.mjs.
 *
 * Kept free of ffmpeg and of the filesystem so it can be tested directly.
 */

/**
 * Int16 magnitude under which a window is silence, ~-60 dBFS.
 *
 * Deliberately absolute rather than a share of the segment's peak. A relative
 * threshold moves when the segment moves: trimming a file shifts the window,
 * which shifts the peak, which shifts the threshold, so a track can read as
 * silent again right after being cut and the trim never converges. Measured on
 * a long quiet fade-in (UYB282548653) the peak over the probed head rose from
 * 699 to 1165 after one cut, and the same file asked to be cut on every run.
 *
 * An absolute floor is also the honest definition: silence is a property of the
 * signal, not of what happens to sit next to it. -60 dBFS is inaudible on a
 * phone speaker under any listening condition this game is played in.
 */
const SILENCE_FLOOR = 33;

/**
 * Root mean square per fixed-size window.
 *
 * RMS rather than a plain average because audio swings symmetrically around
 * zero and would otherwise cancel itself out. A trailing partial window is
 * dropped: averaging it over a full window would under-report its level.
 */
export function rmsWindows(samples, samplesPerWindow) {
  const windows = [];
  for (let start = 0; start + samplesPerWindow <= samples.length; start += samplesPerWindow) {
    let sum = 0;
    for (let i = start; i < start + samplesPerWindow; i++) sum += samples[i] * samples[i];
    windows.push(Math.sqrt(sum / samplesPerWindow));
  }
  return windows;
}

/**
 * Index of the first window carrying audible sound, or -1 when none does.
 *
 * Stable under trimming: the answer for a given window depends only on that
 * window, so cutting the head never changes the verdict on what remains.
 */
export function findOnsetIndex(rms, { floor = SILENCE_FLOOR } = {}) {
  return rms.findIndex((value) => value >= floor);
}

/**
 * Seconds of silence before the sound starts.
 *
 * Returns 0 for a signal too short to hold a single window — there is nothing
 * to trim — and Infinity for one that is silent throughout, so a caller can
 * tell "starts immediately" from "never starts" instead of reading both as 0.
 */
export function onsetSeconds(samples, { sampleRate, windowMs, floor } = {}) {
  const samplesPerWindow = Math.floor((sampleRate * windowMs) / 1000);
  const rms = rmsWindows(samples, samplesPerWindow);
  if (!rms.length) return 0;

  const index = findOnsetIndex(rms, { floor });
  if (index < 0) return Infinity;
  return (index * windowMs) / 1000;
}
