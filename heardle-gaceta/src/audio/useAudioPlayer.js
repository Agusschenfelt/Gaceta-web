import { useCallback, useEffect, useRef, useState } from "react";
import { barHeights } from "./waveform.js";

const FLAT_BARS = barHeights(null, 0, 1);

/**
 * Plays the first N seconds of a track. Progress is 0..1 within the requested
 * clip length so the UI ring fills exactly once per play.
 */
export function useAudioPlayer(src, peaks = null) {
  const audioRef = useRef(null);
  const rafRef = useRef(0);
  const timeoutRef = useRef(0);
  const clipRef = useRef(0);
  // Generation token. `play()` is async, so two fast clicks can both get past
  // their `await audio.play()` and each start a rAF loop; the second overwrites
  // `rafRef`, orphaning the first, which then runs forever. Anything belonging
  // to a superseded generation bails out instead.
  const playIdRef = useRef(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  // Bar heights for the circle, read from the track's precomputed envelope.
  const [levels, setLevels] = useState(FLAT_BARS);
  const [ready, setReady] = useState(false);
  // The file failed to load (404 after a key change, dropped connection…).
  // Without this the ring would pulse "loading" forever and play would fail
  // silently.
  const [failed, setFailed] = useState(false);

  const stop = useCallback(() => {
    playIdRef.current += 1; // invalidate any play still in flight
    cancelAnimationFrame(rafRef.current);
    clearTimeout(timeoutRef.current);
    const audio = audioRef.current;
    if (audio) {
      audio.onplaying = null;
      audio.onwaiting = null;
      audio.ontimeupdate = null;
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    setLevels(FLAT_BARS);
  }, []);

  useEffect(() => {
    stop();
    setReady(false);
    setFailed(false);
    if (!src) {
      audioRef.current = null;
      return undefined;
    }
    const audio = new Audio(src);
    audio.preload = "auto";
    const onReady = () => {
      setReady(true);
      setFailed(false);
    };
    const onError = () => {
      setReady(false);
      setFailed(true);
    };
    audio.addEventListener("canplaythrough", onReady);
    audio.addEventListener("error", onError);
    audio.load();
    audioRef.current = audio;
    return () => {
      audio.removeEventListener("canplaythrough", onReady);
      audio.removeEventListener("error", onError);
      audio.pause();
      audio.src = "";
      audioRef.current = null;
    };
  }, [src, stop]);

  const play = useCallback(
    async (seconds) => {
      const audio = audioRef.current;
      if (!audio || !seconds) return;
      stop();
      // Adopt the token `stop()` just minted; a later play supersedes this one.
      const playId = playIdRef.current;
      const current = () => playId === playIdRef.current;
      clipRef.current = seconds;
      audio.currentTime = 0;
      const finish = () => {
        if (!current()) return;
        cancelAnimationFrame(rafRef.current);
        clearTimeout(timeoutRef.current);
        audio.onplaying = null;
        audio.onwaiting = null;
        audio.ontimeupdate = null;
        audio.pause();
        audio.currentTime = 0;
        setIsPlaying(false);
        setProgress(0);
        setLevels(FLAT_BARS);
      };
      // The clip must stop even when the tab is hidden: requestAnimationFrame
      // is suspended in background tabs, so the hard stop is a timer, backed by
      // the media element's own timeupdate. The timer counts only what is left
      // of the clip and is paused while the audio buffers ('waiting'), so a
      // slow connection never cuts the fragment short.
      audio.onplaying = () => {
        if (!current()) return;
        clearTimeout(timeoutRef.current);
        const left = Math.max(clipRef.current - audio.currentTime, 0);
        timeoutRef.current = setTimeout(finish, left * 1000);
      };
      audio.onwaiting = () => {
        if (!current()) return;
        clearTimeout(timeoutRef.current);
      };
      audio.ontimeupdate = () => {
        if (!current()) return;
        if (audio.currentTime >= clipRef.current || audio.ended) finish();
      };
      try {
        await audio.play();
      } catch {
        audio.onplaying = null;
        audio.onwaiting = null;
        audio.ontimeupdate = null;
        return; // autoplay policy or decode error: leave the UI idle
      }
      if (!current()) return; // a newer play won the race while we awaited
      setIsPlaying(true);
      const tick = () => {
        if (!current()) return; // orphaned loop retires itself
        const t = audio.currentTime;
        setProgress(Math.min(t / clipRef.current, 1));
        // Visual only. The envelope spans the whole file, so it is read against
        // the element's duration, not the clip length for this stage.
        if (peaks) setLevels(barHeights(peaks, t, audio.duration || clipRef.current));
        if (t >= clipRef.current || audio.ended) {
          finish();
          return;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    },
    [stop, peaks]
  );

  /** Tries the same file again after a failed load. */
  const reload = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setFailed(false);
    audio.load();
  }, []);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return { play, stop, reload, isPlaying, progress, ready, failed, levels };
}
