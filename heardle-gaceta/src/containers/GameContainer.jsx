import { useCallback, useEffect, useMemo, useState } from "react";
import { loadCatalog, loadPeaks } from "../catalog/loadCatalog.js";
import { pickTrack, filterPool } from "../catalog/pickTrack.js";
import {
  createGame,
  guess as engineGuess,
  skip as engineSkip,
  currentClipSeconds,
  isOver,
  score,
  stageWon,
  STATUS,
} from "../game/engine.js";
import { useAudioPlayer } from "../audio/useAudioPlayer.js";
import { CLIP_FILE_SECONDS } from "../audio/waveform.js";
import { getPlayerId, getAlias, setAlias as persistAlias } from "../player/playerIdentity.js";
import { getLeaderboardApi } from "../leaderboard/leaderboardApi.js";
import { withRetry } from "../leaderboard/retry.js";
import { GameBoard } from "../components/organisms/GameBoard.jsx";
import { ResultReveal } from "../components/organisms/ResultReveal.jsx";
import { Leaderboard } from "../components/organisms/Leaderboard.jsx";
import { GameSettings } from "../components/molecules/GameSettings.jsx";
import { GuessHistory } from "../components/molecules/GuessHistory.jsx";
import { Spinner } from "../components/atoms/Spinner.jsx";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

const FILTER_KEY = "heardle:artistFilter";
const EMAIL_FLAG_KEY = "heardle:emailPrompt";

function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function GameContainer() {
  const [catalog, setCatalog] = useState(null);
  const [peaks, setPeaks] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [artistFilter, setArtistFilter] = useState(() => readStored(FILTER_KEY, []));
  const [game, setGame] = useState(null);
  const [alias, setAliasState] = useState(() => getAlias());
  const [board, setBoard] = useState({ rows: [], loading: false, error: null });
  const [emailPrompt, setEmailPrompt] = useState(() => readStored(EMAIL_FLAG_KEY, "pending"));
  // The ranking is a view of its own, reached from the result, never stacked under it.
  const [showRanking, setShowRanking] = useState(false);
  // idle | saving | error — the round is only really recorded on idle.
  const [submitState, setSubmitState] = useState("idle");
  // Drives the opening title: it clears on the first play of each round.
  const [hasPlayed, setHasPlayed] = useState(false);

  const [api, setApi] = useState(null);
  const playerId = useMemo(() => getPlayerId(), []);
  // Wide screens have room on both sides of the board; use it instead of
  // leaving the game floating in empty margins.
  const isWide = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    getLeaderboardApi().then(setApi);
  }, []);

  useEffect(() => {
    loadCatalog().then(setCatalog).catch((e) => setLoadError(e.message));
    // Deliberately not awaited with the catalog: the bars can arrive late, the
    // round cannot.
    loadPeaks().then(setPeaks);
  }, []);

  const tracksById = useMemo(
    () => new Map(catalog?.tracks.map((t) => [t.id, t]) ?? []),
    [catalog]
  );

  const poolSize = useMemo(
    () => (catalog ? filterPool(catalog.tracks, artistFilter).length : 0),
    [catalog, artistFilter]
  );

  const startRound = useCallback(
    (filter = artistFilter) => {
      if (!catalog) return;
      const track = pickTrack(catalog.tracks, filter);
      setShowRanking(false);
      setSubmitState("idle");
      setHasPlayed(false);
      setGame(track ? createGame({ track }) : null);
    },
    [catalog, artistFilter]
  );

  useEffect(() => {
    if (catalog && !game) startRound();
  }, [catalog, game, startRound]);

  const audio = useAudioPlayer(
    game?.track.audioFile ?? null,
    game ? (peaks[game.track.id] ?? null) : null
  );

  const refreshBoard = useCallback(async () => {
    if (!api) return;
    setBoard((b) => ({ ...b, loading: true, error: null }));
    try {
      const rows = await api.getTop(20);
      setBoard({ rows, loading: false, error: null });
    } catch (e) {
      setBoard({ rows: [], loading: false, error: e });
    }
  }, [api]);

  const submitRound = useCallback(async () => {
    if (!game || !api) return;
    setSubmitState("saving");
    try {
      await withRetry(() =>
        api.submitGame({
          playerId,
          trackId: game.track.id,
          won: game.status === STATUS.WON,
          stageWon: stageWon(game),
          attempts: game.attempts.length,
          score: score(game),
        }),
      );
      setSubmitState("idle");
    } catch {
      // Say it out loud rather than pretend the round was recorded.
      setSubmitState("error");
    } finally {
      refreshBoard();
    }
  }, [game, api, playerId, refreshBoard]);

  // Submit the round as soon as it ends, then refresh the ranking.
  useEffect(() => {
    if (!game || !isOver(game) || !api) return;
    submitRound();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status, api]);

  // The reveal plays the song. The guess that ended the round was a click, so
  // the browser already counts the page as activated; if it still refuses, the
  // record just waits for a tap.
  useEffect(() => {
    if (!game || !isOver(game)) return;
    audio.play(CLIP_FILE_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  function onPlay() {
    if (!game) return;
    setHasPlayed(true);
    audio.play(currentClipSeconds(game));
  }

  function onGuess(track) {
    setGame((g) => engineGuess(g, track.id));
  }

  function onSkip() {
    audio.stop();
    setGame((g) => engineSkip(g));
  }

  function onChangeFilter(next) {
    setArtistFilter(next);
    writeStored(FILTER_KEY, next);
    audio.stop();
    startRound(next);
  }

  async function onSetAlias(next) {
    const saved = persistAlias(next);
    setAliasState(saved);
    try {
      await api?.setAlias(playerId, saved);
    } catch {
      /* ranking stays local until it works */
    }
    refreshBoard();
  }

  async function onSubmitEmail(email) {
    if (!api) throw new Error("Leaderboard not ready");
    await api.subscribeEmail(email, playerId);
    setEmailPrompt("done");
    writeStored(EMAIL_FLAG_KEY, "done");
  }

  function onDismissEmail() {
    setEmailPrompt("dismissed");
    writeStored(EMAIL_FLAG_KEY, "dismissed");
  }

  if (loadError) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-danger">No pudimos cargar el catálogo: {loadError}</p>
      </div>
    );
  }
  if (!catalog) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner label="Cargando catálogo" />
      </div>
    );
  }

  const over = game ? isOver(game) : false;

  // One view at a time. Each one owns the full frame, so nothing ever stacks
  // past the fold.
  if (showRanking) {
    return (
      <Leaderboard
        rows={board.rows}
        loading={board.loading}
        error={board.error}
        alias={alias}
        onSetAlias={onSetAlias}
        onClose={() => setShowRanking(false)}
        emailPrompt={emailPrompt}
        onSubmitEmail={onSubmitEmail}
        onDismissEmail={onDismissEmail}
      />
    );
  }

  if (game && over) {
    return (
      <ResultReveal
        game={game}
        onPlayAgain={() => startRound()}
        onShowRanking={() => {
          audio.stop();
          setShowRanking(true);
        }}
        peaks={peaks[game.track.id] ?? null}
        audio={audio}
        submitState={submitState}
        onRetrySubmit={submitRound}
      />
    );
  }

  const settings = (
    <GameSettings
      artists={catalog.artists}
      selected={artistFilter}
      onChangeArtists={onChangeFilter}
      poolSize={poolSize}
      variant={isWide ? "panel" : "bar"}
    />
  );

  const gameView = game ? (
    <GameBoard
      game={game}
      peaks={peaks[game.track.id] ?? null}
      tracks={catalog.tracks}
      tracksById={tracksById}
      audio={audio}
      hasPlayed={hasPlayed}
      showHistory={!isWide}
      onPlay={onPlay}
      onGuess={onGuess}
      onSkip={onSkip}
    />
  ) : poolSize === 0 ? (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-sm text-muted">No hay temas para esa selección.</p>
    </div>
  ) : (
    // There are tracks, the round just has not been built yet. Saying
    // "no hay temas" here flashes a lie between catalog load and startRound.
    <div className="flex flex-1 items-center justify-center">
      <Spinner label="Preparando la ronda" />
    </div>
  );

  // Wide: settings and attempts take the side columns, so the board keeps its
  // comfortable width and the margins stop being dead space.
  if (isWide) {
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[13rem_minmax(0,26rem)_13rem] justify-center gap-10">
        <aside className="flex min-h-0 flex-col justify-center" aria-label="Ajustes">
          {settings}
        </aside>
        <div className="flex min-h-0 flex-col">{gameView}</div>
        <aside className="flex min-h-0 flex-col justify-center" aria-label="Intentos">
          {game && (
            <GuessHistory
              variant="ladder"
              attempts={game.attempts}
              tracksById={tracksById}
              stages={game.stages}
              stageIndex={game.stageIndex}
            />
          )}
        </aside>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col gap-2">
      {settings}
      {gameView}
    </div>
  );
}
