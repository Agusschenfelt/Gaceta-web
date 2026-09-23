import { useState } from "react";
import { Button } from "../atoms/Button.jsx";
import { Icon } from "../atoms/Icon.jsx";
import { StageProgress } from "../molecules/StageProgress.jsx";
import { WaveRing } from "../molecules/WaveRing.jsx";
import { STATUS, score } from "../../game/engine.js";
import { buildShareText } from "../../game/share.js";
import { CLIP_FILE_SECONDS, RING_TICKS, unlockedTicks } from "../../audio/waveform.js";

function formatSeconds(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

/** Entrance delay for the n-th row, so the view assembles instead of appearing. */
function stagger(n) {
  return { animationDelay: `${250 + n * 70}ms` };
}

/**
 * Replaces the board rather than stacking under it, and mirrors its shape: the
 * record sits where the play circle was, inside the same ring, so the reveal
 * fits the same frame without scrolling.
 *
 * The song plays on arrival. The cover turns like a record while it does, the
 * ring now spans the whole clip, and the part the player needed stays acid
 * gold. Tapping the record stops or restarts it.
 */
export function ResultReveal({
  game,
  onPlayAgain,
  onShowRanking,
  submitState = "idle",
  onRetrySubmit,
  peaks = null,
  audio,
}) {
  const { track } = game;
  const won = game.status === STATUS.WON;
  const heard = game.stages[game.stageIndex];
  const isPlaying = audio?.isPlaying ?? false;
  const lit = isPlaying
    ? audio.progress * RING_TICKS
    : won
      ? unlockedTicks(heard, CLIP_FILE_SECONDS)
      : 0;

  function toggleSong() {
    if (!audio) return;
    if (isPlaying) audio.stop();
    else audio.play(CLIP_FILE_SECONDS);
  }
  const [copied, setCopied] = useState(false);

  async function share() {
    const text = buildShareText({ state: game, url: window.location.origin });
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        /* user cancelled: fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <section
      className="mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 overflow-hidden"
      aria-label="Resultado"
      aria-live="polite"
    >
      <div className="flex shrink-0 items-end justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="headline text-5xl !leading-[1.1]">
            <span className="word-mask">
              <span className="word-rise">{won ? "Acertaste" : "No era"}</span>
            </span>
            {!won && (
              <>
                {" "}
                <span className="word-mask">
                  <em className="word-rise" style={{ animationDelay: "80ms" }}>
                    ese
                  </em>
                </span>
              </>
            )}
          </h2>
          <span className="label rise" style={stagger(0)}>
            {won
              ? `Con ${formatSeconds(heard)} s · intento ${game.stageIndex + 1} de ${game.stages.length}`
              : "Era este tema"}
          </span>
        </div>
        {won ? (
          /* Acid gold is the system's punctuation for a moment of impact, and
             there is no bigger one here than having got it right. */
          <span className="roll-in flex shrink-0 items-baseline gap-1" style={stagger(1)}>
            <span className="headline text-6xl !leading-none text-accent tabular-nums">
              {score(game)}
            </span>
            <span className="font-display text-xl italic text-accent">pts</span>
          </span>
        ) : null}
      </div>

      {submitState === "error" && (
        <p className="flex shrink-0 items-center justify-between gap-2 text-xs text-danger">
          No pudimos guardar esta partida en el ranking.
          <button type="button" onClick={onRetrySubmit} className="underline hover:text-fg">
            Reintentar
          </button>
        </p>
      )}

      <div className="flex min-h-0 flex-1 basis-0 items-center justify-center">
        <button
          type="button"
          onClick={toggleSong}
          aria-label={isPlaying ? "Pausar el tema" : "Escuchar el tema"}
          className="group relative aspect-square h-full max-h-[26rem] w-auto max-w-full rounded-full"
        >
          <span className="absolute inset-0 transition-transform duration-500 ease-out group-hover:scale-[1.03]">
            <WaveRing peaks={peaks} span={CLIP_FILE_SECONDS} unlocked={RING_TICKS} lit={lit} />
          </span>
          <span className="disc-in absolute inset-[17%] rounded-full">
            <span
              className="disc-spin absolute inset-0 overflow-hidden rounded-full border border-border bg-surface"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
            >
              {track.coverUrl && (
                <img src={track.coverUrl} alt="" className="h-full w-full object-cover" />
              )}
            </span>
            {/* The spindle hole: it is a record now. */}
            <span className="absolute left-1/2 top-1/2 h-[9%] w-[9%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-border bg-bg" />
          </span>
        </button>
      </div>

      <div className="rise flex min-w-0 shrink-0 flex-col gap-1" style={stagger(2)}>
        <span className="headline truncate text-3xl !leading-[1.15]">{track.title}</span>
        <span className="truncate text-sm text-muted">{track.artists.join(", ")}</span>
      </div>

      <div className="rise flex shrink-0 items-center gap-3" style={stagger(3)}>
        <div className="flex-1" aria-label="Patrón de intentos">
          <StageProgress
            stages={game.stages}
            attempts={game.attempts}
            stageIndex={game.stageIndex}
            isPlaying={false}
          />
        </div>
        <button
          type="button"
          onClick={onShowRanking}
          className="label flex shrink-0 items-center gap-1.5 transition-colors hover:text-fg"
        >
          <Icon name="trophy" size={13} />
          Ranking
        </button>
      </div>

      <div className="rise flex shrink-0 flex-col gap-2" style={stagger(4)}>
        <Button variant="primary" onClick={share}>
          {copied ? "Copiado" : "Compartí el resultado"}
        </Button>
        <div className="flex gap-2">
          <Button variant="accent" onClick={onPlayAgain} className="flex-1">
            Jugar otra vez
          </Button>
          {track.spotifyUrl && (
            <a
              href={track.spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex flex-1 items-center justify-center rounded border border-border px-4 py-2.5 text-sm font-medium tracking-tight text-fg transition-colors hover:border-fg"
            >
              Spotify
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
