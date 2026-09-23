import { useState } from "react";
import { ActionButton } from "../atoms/ActionButton.jsx";
import { Icon } from "../atoms/Icon.jsx";
import { StageProgress } from "../molecules/StageProgress.jsx";
import { WaveRing } from "../molecules/WaveRing.jsx";
import { STATUS } from "../../game/engine.js";
import { formatSeconds } from "../../game/format.js";
import { buildShareText } from "../../game/share.js";
import { CLIP_FILE_SECONDS, RING_TICKS, unlockedTicks } from "../../audio/waveform.js";


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
  /* The answer, looked up in the catalog from the round's `answerId`. */
  track,
  onPlayAgain,
  onShowRanking,
  peaks = null,
  audio,
}) {
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
            {game.ranked === false && " · no suma al ranking"}
          </span>
        </div>
        {won ? (
          /* Acid gold is the system's punctuation for a moment of impact, and
             there is no bigger one here than having got it right. */
          <span className="roll-in flex shrink-0 items-baseline gap-1" style={stagger(1)}>
            <span className="headline text-6xl !leading-none text-accent tabular-nums">
              {game.score}
            </span>
            <span className="font-display text-xl italic text-accent">pts</span>
          </span>
        ) : null}
      </div>


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

      {/* Play again first, then the song on Spotify: the two things worth
          doing next. Sharing is still one tap away, just quieter. */}
      <div className="rise flex shrink-0 flex-col gap-1" style={stagger(4)}>
        <div className="flex gap-2">
          <ActionButton
            tone="accent"
            icon="replay"
            iconMotion="group-hover:-rotate-180"
            onClick={onPlayAgain}
            className="flex-[1.5]"
          >
            Jugar otra vez
          </ActionButton>
          {track.spotifyUrl && (
            <ActionButton
              tone="spotify"
              icon="arrowUpRight"
              iconMotion="group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              href={track.spotifyUrl}
              className="flex-1"
            >
              Spotify
            </ActionButton>
          )}
        </div>
        <button
          type="button"
          onClick={share}
          className="group flex min-h-11 items-center justify-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <Icon
            name={copied ? "check" : "share"}
            size={15}
            className={`transition-transform duration-300 group-hover:-translate-y-0.5 ${copied ? "text-accent" : ""}`}
          />
          <span className="underline decoration-border underline-offset-4 transition-colors group-hover:decoration-fg">
            {copied ? "Copiado, pegalo donde quieras" : "Compartí tu resultado"}
          </span>
        </button>
      </div>
    </section>
  );
}
