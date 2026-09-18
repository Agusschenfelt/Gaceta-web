import { StageProgress } from "../molecules/StageProgress.jsx";
import { PlayCircle } from "../molecules/PlayCircle.jsx";
import { StageCounter } from "../molecules/StageCounter.jsx";
import { GuessSearch } from "../molecules/GuessSearch.jsx";
import { GuessHistory } from "../molecules/GuessHistory.jsx";
import { Button } from "../atoms/Button.jsx";
import { currentClipSeconds, isOver } from "../../game/engine.js";

/**
 * A fixed-height frame: every row sizes to its content except the circle, which
 * takes whatever is left. The board therefore never scrolls — a short viewport
 * or a long attempt history is absorbed by the circle.
 */
export function GameBoard({
  game,
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
        <p className="headline fade-up shrink-0 pt-1 text-4xl !leading-[1.2]">
          Adiviná el <em>tema</em>
        </p>
      )}

      <div className="flex min-h-0 flex-1 basis-0 items-center justify-center">
        <PlayCircle
          isPlaying={audio.isPlaying}
          progress={audio.progress}
          disabled={over}
          loading={!audio.ready}
          levels={audio.levels}
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
