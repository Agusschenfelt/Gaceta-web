import { useEffect, useRef } from "react";
import { StageProgress } from "../molecules/StageProgress.jsx";
import { PlayCircle } from "../molecules/PlayCircle.jsx";
import { StageCounter } from "../molecules/StageCounter.jsx";
import { GuessSearch } from "../molecules/GuessSearch.jsx";
import { GuessHistory } from "../molecules/GuessHistory.jsx";
import { Button } from "../atoms/Button.jsx";
import { currentClipSeconds, isOver } from "../../game/engine.js";

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
  // The hook floors bars at 0.18 so they never vanish; undo that for the beat.
  return Math.max((middle - 0.18) / 0.82, 0);
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
  /* Wide layouts move the attempt list into its own column, so the board
     renders it only when it owns it. */
  showHistory = true,
  onPlay,
  onGuess,
  onSkip,
}) {
  const over = isOver(game);
  const seconds = currentClipSeconds(game);
  const span = game.stages[game.stages.length - 1];
  const circleRef = useRef(null);
  const missCount = game.attempts.filter((a) => a.type === "guess" && !a.correct).length;

  useEffect(() => {
    if (missCount === 0 || !circleRef.current?.animate) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    circleRef.current.animate(MISS_SHAKE, { duration: 380, easing: "ease-out" });
  }, [missCount]);

  return (
    <section
      className="flex min-h-0 w-full flex-1 flex-col gap-2.5 overflow-hidden"
      aria-label="Juego"
    >
      <StageProgress
        stages={game.stages}
        attempts={game.attempts}
        stageIndex={game.stageIndex}
        isPlaying={audio.isPlaying}
      />

      {/* Every round opens on the title and clears the moment you press play,
          so the screen still gets its display type without paying for it the
          whole round. The circle takes the space back. */}
      {!hasPlayed && game.attempts.length === 0 && (
        <p className="headline shrink-0 pt-1 text-4xl lg:text-5xl !leading-[1.2]">
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

      <div ref={circleRef} className="flex min-h-0 flex-1 basis-0 items-center justify-center">
        <PlayCircle
          isPlaying={audio.isPlaying}
          progress={audio.progress}
          disabled={over}
          loading={!audio.ready}
          level={currentLevel(audio.levels)}
          peaks={peaks}
          seconds={seconds}
          span={span}
          onPlay={onPlay}
        />
      </div>

      <div className="flex shrink-0 items-end justify-between gap-3">
        <StageCounter seconds={seconds} stageIndex={game.stageIndex} total={game.stages.length} />
        <Button variant="ghost" onClick={onSkip} disabled={over} className="-mr-4">
          Saltar →
        </Button>
      </div>

      {/* Keyed by track so the typed query resets whenever a new round starts. */}
      <GuessSearch key={game.track.id} tracks={tracks} disabled={over} onSelect={onGuess} />

      {showHistory && <GuessHistory attempts={game.attempts} tracksById={tracksById} />}
    </section>
  );
}
