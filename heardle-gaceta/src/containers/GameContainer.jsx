import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCatalog, loadPeaks } from "../catalog/loadCatalog.js";
import { filterPool } from "../catalog/pickTrack.js";
import { currentClipSeconds, isOver } from "../game/engine.js";
import { useAudioPlayer } from "../audio/useAudioPlayer.js";
import { CLIP_FILE_SECONDS } from "../audio/waveform.js";
import { getAlias, setAlias as persistAlias } from "../player/playerIdentity.js";
import { getGameServices } from "../services/gameServices.js";
import { audioUrl, PEAKS_URL } from "../services/assetUrls.js";
import { withRetry } from "../leaderboard/retry.js";
import { toRoundError } from "../rounds/roundErrors.js";
import { answerTrack } from "../rounds/answerTrack.js";
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

const sameSet = (a, b) => a.length === b.length && a.every((x) => b.includes(x));

const isConnectionError = (e) => toRoundError(e).code === "network";


export function GameContainer() {
  const [catalog, setCatalog] = useState(null);
  const [peaks, setPeaks] = useState({});
  const [loadError, setLoadError] = useState(null);
  const [artistFilter, setArtistFilter] = useState(() => readStored(FILTER_KEY, []));
  // The filter the current round was dealt with. When the player changes the
  // chips mid-round the new filter waits for the next round: see GameSettings.
  const [dealtFilter, setDealtFilter] = useState(null);
  // The round as the rounds service reports it; see gameServices.js for the
  // shape. The answer (`answerId`) is only there once the round is over.
  const [game, setGame] = useState(null);
  const [roundError, setRoundError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [alias, setAliasState] = useState(() => getAlias());
  // `me` is this player's own numbers, so the ranking can say how far they are
  // from appearing on it.
  const [board, setBoard] = useState({ rows: [], me: null, loading: false, error: null });
  const [emailPrompt, setEmailPrompt] = useState(() => readStored(EMAIL_FLAG_KEY, "pending"));
  // The ranking is a view of its own, reached from the result, never stacked under it.
  const [showRanking, setShowRanking] = useState(false);
  // Drives the opening title: it clears on the first play of each round.
  const [hasPlayed, setHasPlayed] = useState(false);

  const [services, setServices] = useState(null);
  const dealing = useRef(false);
  // Wide screens have room on both sides of the board; use it instead of
  // leaving the game floating in empty margins.
  const isWide = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setLoadError(`No pudimos cargar el catálogo: ${e.message}`));
    // Deliberately not awaited with the catalog: the bars can arrive late, the
    // round cannot.
    loadPeaks(PEAKS_URL).then(setPeaks);
  }, []);

  useEffect(() => {
    if (!catalog) return;
    getGameServices({ tracks: catalog.tracks })
      .then(setServices)
      .catch((e) => setLoadError(toRoundError(e).message));
  }, [catalog]);

  const tracksById = useMemo(
    () => new Map(catalog?.tracks.map((t) => [t.id, t]) ?? []),
    [catalog]
  );

  const poolSize = useMemo(
    () => (catalog ? filterPool(catalog.tracks, artistFilter).length : 0),
    [catalog, artistFilter]
  );

  const startRound = useCallback(async () => {
    if (!services || !catalog || dealing.current) return;
    dealing.current = true;
    const filter = artistFilter;
    // "All" means all the artists this browser loaded: a track whose catalog
    // file failed could not be searched, so it must not be dealt either.
    const dealFrom = filter.length ? filter : catalog.artists.map((a) => a.slug);
    setShowRanking(false);
    setRoundError(null);
    try {
      // Only a dropped connection is worth retrying; a refusal is final.
      const round = await withRetry(() => services.rounds.start(dealFrom), {
        shouldRetry: isConnectionError,
      });
      setHasPlayed(false);
      setDealtFilter(filter);
      setGame(round);
    } catch (e) {
      setRoundError(toRoundError(e).message);
    } finally {
      dealing.current = false;
    }
  }, [services, artistFilter, catalog]);

  useEffect(() => {
    if (services && !game && !roundError) startRound();
  }, [services, game, roundError, startRound]);

  const audioKey = game?.audioKey ?? null;
  const roundPeaks = audioKey ? (peaks[audioKey] ?? null) : null;
  const audio = useAudioPlayer(audioKey ? audioUrl(audioKey) : null, roundPeaks);

  const refreshBoard = useCallback(async () => {
    if (!services) return;
    setBoard((b) => ({ ...b, loading: true, error: null }));
    try {
      const [rows, me] = await Promise.all([
        services.board.getTop(20),
        services.board.getPlayerStats(),
      ]);
      setBoard({ rows, me, loading: false, error: null });
      // The server knows the alias better than this browser does.
      if (me?.alias) {
        setAliasState(me.alias);
        persistAlias(me.alias);
      }
    } catch (e) {
      setBoard({ rows: [], me: null, loading: false, error: e });
    }
  }, [services]);

  // A finished round is already recorded by whoever judged it; just refresh.
  useEffect(() => {
    if (game && isOver(game)) refreshBoard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  // The reveal plays the song. The guess that ended the round was a click, so
  // the browser already counts the page as activated; if it still refuses, the
  // record just waits for a tap.
  useEffect(() => {
    if (!game || !isOver(game)) return;
    audio.play(CLIP_FILE_SECONDS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.status]);

  /**
   * Sends one action to the judge. One at a time; the round only changes on
   * its answer. Retrying a dropped connection is safe: the action carries the
   * attempt count it was made on, so the judge never records it twice.
   */
  async function act(run) {
    if (!game || busy) return;
    setBusy(true);
    setRoundError(null);
    const { id, attempts } = game;
    try {
      setGame(await withRetry(() => run(id, attempts.length), { shouldRetry: isConnectionError }));
    } catch (e) {
      setRoundError(toRoundError(e).message);
    } finally {
      setBusy(false);
    }
  }

  function onPlay() {
    if (!game) return;
    // A failed file gets another try instead of a silent play() rejection.
    if (audio.failed) {
      audio.reload();
      return;
    }
    setHasPlayed(true);
    audio.play(currentClipSeconds(game));
  }

  function onGuess(track) {
    act((id, attempt) => services.rounds.guess(id, track.id, attempt));
  }

  function onSkip() {
    audio.stop();
    act((id, attempt) => services.rounds.skip(id, attempt));
  }

  function onChangeFilter(next) {
    setArtistFilter(next);
    writeStored(FILTER_KEY, next);
  }

  function onPlayAgain() {
    setGame(null);
    setRoundError(null);
  }

  async function onSetAlias(next) {
    // The judge validates and normalises; keep what it stored.
    const saved = await services.board.setAlias(next.trim());
    setAliasState(persistAlias(saved));
    refreshBoard();
  }

  async function onSubmitEmail(email) {
    if (!services) throw new Error("Services not ready");
    await services.board.subscribeEmail(email);
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
        <p className="text-sm text-danger">{loadError}</p>
      </div>
    );
  }
  if (!catalog || !services) {
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
        me={board.me}
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
        track={answerTrack(game, tracksById, catalog.artists)}
        onPlayAgain={onPlayAgain}
        onShowRanking={() => {
          audio.stop();
          setShowRanking(true);
        }}
        peaks={roundPeaks}
        audio={audio}
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
      pendingNextRound={Boolean(game && dealtFilter && !sameSet(dealtFilter, artistFilter))}
    />
  );

  const ladder = game ? (
    <GuessHistory
      variant="ladder"
      attempts={game.attempts}
      tracksById={tracksById}
      stages={game.stages}
      stageIndex={game.stageIndex}
    />
  ) : null;

  // Wide: settings and the attempt ladder take the side columns, placed by the
  // board in the circle's row so all three centre on the same line.
  const gameView = game ? (
    <GameBoard
      game={game}
      peaks={roundPeaks}
      tracks={catalog.tracks}
      tracksById={tracksById}
      audio={audio}
      hasPlayed={hasPlayed}
      left={isWide ? settings : null}
      right={isWide ? ladder : null}
      busy={busy}
      error={
        roundError ??
        (audio.failed ? "No pudimos cargar el fragmento. Tocá el círculo para reintentar." : null)
      }
      onPlay={onPlay}
      onGuess={onGuess}
      onSkip={onSkip}
    />
  ) : roundError ? (
    // No round could be dealt: say why, and let them try again (for an empty
    // selection, after changing the chips).
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p role="alert" className="text-sm text-danger">
        {roundError}
      </p>
      <button
        type="button"
        onClick={() => setRoundError(null)}
        className="label transition-colors hover:text-fg"
      >
        Reintentar
      </button>
    </div>
  ) : (
    // The round is on its way. Saying "no hay temas" here would flash a lie
    // between loading and the first deal.
    <div className="flex flex-1 items-center justify-center">
      <Spinner label="Preparando la ronda" />
    </div>
  );

  if (isWide) {
    if (game) return gameView;
    // No round on the board (loading, or refused): keep the chips reachable,
    // since an empty selection is fixed by changing them.
    return (
      <div className="grid min-h-0 flex-1 grid-cols-[13rem_minmax(0,26rem)_13rem] justify-center gap-x-10">
        <aside className="flex min-h-0 flex-col justify-center" aria-label="Ajustes">
          {settings}
        </aside>
        <div className="flex min-h-0 flex-col">{gameView}</div>
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
