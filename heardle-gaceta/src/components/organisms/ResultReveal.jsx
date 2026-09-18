import { useState } from "react";
import { Button } from "../atoms/Button.jsx";
import { Icon } from "../atoms/Icon.jsx";
import { STATUS, score } from "../../game/engine.js";
import { buildShareText, buildPattern } from "../../game/share.js";

/**
 * Replaces the board rather than stacking under it, and mirrors its shape: the
 * cover art is the elastic element where the play circle was, so the reveal
 * fits the same frame without scrolling.
 */
export function ResultReveal({
  game,
  onPlayAgain,
  onShowRanking,
  submitState = "idle",
  onRetrySubmit,
}) {
  const { track } = game;
  const won = game.status === STATUS.WON;
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
      className="fade-up mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 overflow-hidden"
      aria-label="Resultado"
      aria-live="polite"
    >
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <h2 className="headline text-xl !leading-snug">
          {won ? (
            <>
              {/* Acid gold is the system's punctuation for a moment of impact,
                  and there is no bigger one here than having got it right. */}
              Acertaste · <em className="text-accent">{score(game)} pts</em>
            </>
          ) : (
            <>
              No era <em>ese</em>
            </>
          )}
        </h2>
        <button
          type="button"
          onClick={onShowRanking}
          className="label flex items-center gap-1.5 transition-colors hover:text-fg"
        >
          <Icon name="trophy" size={13} />
          Ranking
        </button>
      </div>

      {submitState === "error" && (
        <p className="flex shrink-0 items-center justify-between gap-2 text-xs text-danger">
          No pudimos guardar esta partida en el ranking.
          <button type="button" onClick={onRetrySubmit} className="underline hover:text-fg">
            Reintentar
          </button>
        </p>
      )}

      {track.coverUrl && (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <img
            src={track.coverUrl}
            alt=""
            className="aspect-square h-full max-h-64 w-auto max-w-full rounded object-cover"
          />
        </div>
      )}

      <div className="flex min-w-0 shrink-0 flex-col">
        <span className="truncate text-lg font-semibold tracking-tight">{track.title}</span>
        <span className="truncate text-sm text-muted">{track.artists.join(", ")}</span>
      </div>

      {/* Emoji glyphs sit taller than their em box, so this needs real leading. */}
      <p className="shrink-0 text-lg leading-normal tracking-[0.2em]" aria-label="Patrón de intentos">
        {buildPattern(game)}
      </p>

      <div className="flex shrink-0 flex-col gap-2">
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
