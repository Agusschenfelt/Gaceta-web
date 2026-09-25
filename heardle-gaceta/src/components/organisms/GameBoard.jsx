import { useEffect, useRef } from "react";
import { StageProgress } from "../molecules/StageProgress.jsx";
import { PlayCircle } from "../molecules/PlayCircle.jsx";
import { StageCounter } from "../molecules/StageCounter.jsx";
import { GuessSearch } from "../molecules/GuessSearch.jsx";
import { GuessHistory } from "../molecules/GuessHistory.jsx";
import { Button } from "../atoms/Button.jsx";
import { currentClipSeconds, isOver } from "../../game/engine.js";
import { levelFromBar } from "../../audio/waveform.js";

/** A miss knocks the circle sideways once. Decays so it reads as a hit, not a wobble. */
const MISS_SHAKE = [
  { transform: "translateX(0)" },
  { transform: "translateX(-10px)" },
  { transform: "translateX(8px)" },
  { transform: "translateX(-5px)" },
  { transform: "translateX(2px)" },
  { transform: "translateX(0)" },
];

/** Level of the envelope right now, 0..1, from the middle bar the audio hook reports. */
function currentLevel(levels) {
  const middle = levels?.[Math.floor((levels?.length ?? 0) / 2)] ?? 0;
  return levelFromBar(middle);
}

/**
 * A fixed-height frame: every row sizes to its content except the circle, which
 * takes whatever is left. The board therefore never scrolls — a short viewport
 * or a long attempt history is absorbed by the circle.
 */
export function GameBoard({
  game,
  peaks = null,
  tracks,
  tracksById,
  audio,
  hasPlayed,
  /* Wide layouts pass the side columns in. The board then lays itself out as
     the same three-column grid as the header, and puts them in the circle's
     row so they centre on the circle rather than on the whole screen. The
     attempt ladder on the right replaces both the list and the top bar. */
  left = null,
  right = null,
  /* A guess or skip is on its way to the server: no second one until it lands. */
  busy = false,
  /* What went wrong with the last action, in words, or null. */
  error = null,
  onPlay,
  onGuess,
  onSkip,
}) {
  const over = isOver(game);
  const seconds = currentClipSeconds(game);
  const span = game.stages[game.stages.length - 1];
  const circleRef = useRef(null);
  const wide = Boolean(left || right);
  // Grid placement, only when wide; narrow keeps the single flex column.
  const at = (classes) => (wide ? classes : "");
  const missCount = game.attempts.filter((a) => a.type === "guess" && !a.correct).length;

  useEffect(() => {
    if (missCount === 0 || !circleRef.current?.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    circleRef.current.animate(MISS_SHAKE, { duration: 380, easing: "ease-out" });
  }, [missCount]);

  return (
    <section
      className={
        wide
          ? "grid min-h-0 w-full flex-1 grid-cols-[13rem_minmax(0,26rem)_13rem] grid-rows-[auto_minmax(0,1fr)_auto_auto] justify-center gap-x-10 gap-y-2.5 overflow-hidden"
          : "flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden"
      }
      aria-label="Juego"
    >
      {!wide && (
        <StageProgress
          stages={game.stages}
          attempts={game.attempts}
          stageIndex={game.stageIndex}
          isPlaying={audio.isPlaying}
        />
      )}

      {/* Every round opens on the title and clears the moment you press play,
          so the screen still gets its display type without paying for it the
          whole round. The circle takes the space back. */}
      {!hasPlayed && game.attempts.length === 0 && (
        <p
          className={`headline shrink-0 pt-1 text-4xl lg:text-5xl !leading-[1.2] ${at("col-start-2 row-start-1")}`}
        >
          {/* Words rise out of their own line, one after the other. */}
          <span className="word-mask">
            <span className="word-rise">Adiviná</span>
          </span>{" "}
          <span className="word-mask">
            <span className="word-rise" style={{ animationDelay: "70ms" }}>
              el
            </span>
          </span>{" "}
          <span className="word-mask">
            <em className="word-rise" style={{ animationDelay: "140ms" }}>
              tema
            </em>
          </span>
        </p>
      )}

      {left && (
        <aside className="col-start-1 row-start-2 min-w-0 self-center" aria-label="Ajustes">
          {left}
        </aside>
      )}

      <div
        ref={circleRef}
        className={`flex min-h-0 flex-1 basis-0 items-center justify-center ${at("col-start-2 row-start-2")}`}
      >
        <PlayCircle
          isPlaying={audio.isPlaying}
          progress={audio.progress}
          disabled={over}
          loading={!audio.ready && !audio.failed}
          level={currentLevel(audio.levels)}
          peaks={peaks}
          seconds={seconds}
          span={span}
          onPlay={onPlay}
        />
      </div>

      {right && (
        <aside className="col-start-3 row-start-2 min-w-0 self-center" aria-label="Intentos">
          {right}
        </aside>
      )}

      <div className={`flex shrink-0 items-end justify-between gap-3 ${at("col-start-2 row-start-3")}`}>
        <StageCounter seconds={seconds} stageIndex={game.stageIndex} total={game.stages.length} />
        <Button variant="ghost" onClick={onSkip} disabled={over || busy} className="-mr-4">
          Saltar →
        </Button>
      </div>

      {/* Keyed by round so the typed query resets whenever a new round starts. */}
      <div className={`flex shrink-0 flex-col gap-1.5 ${at("col-start-2 row-start-4")}`}>
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        <GuessSearch key={game.id} tracks={tracks} disabled={over} onSelect={onGuess} />
      </div>

      {!wide && <GuessHistory attempts={game.attempts} tracksById={tracksById} />}
    </section>
  );
}
