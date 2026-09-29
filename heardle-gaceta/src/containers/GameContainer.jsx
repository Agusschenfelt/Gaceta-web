import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadCatalog, loadPeaks } from "../catalog/loadCatalog.js";
import { filterPool } from "../catalog/pickTrack.js";
import { currentClipSeconds, isOver } from "../game/engine.js";
import { useAudioPlayer } from "../audio/useAudioPlayer.js";
import { CLIP_FILE_SECONDS } from "../audio/waveform.js";
import { getGameServices } from "../services/gameServices.js";
import { audioUrl, PEAKS_URL } from "../services/assetUrls.js";
import { withRetry, withTimeout } from "../shared/retry.js";
import { resolveDealtFilter } from "../rounds/dealtFilter.js";
import { toRoundError } from "../rounds/roundErrors.js";
import { answerTrack } from "../rounds/answerTrack.js";
import { nextRoundsFinished } from "../player/emailPrompt.js";
import { GameBoard } from "../components/organisms/GameBoard.jsx";
import { ResultReveal } from "../components/organisms/ResultReveal.jsx";
import { GameSettings } from "../components/molecules/GameSettings.jsx";
import { GuessHistory } from "../components/molecules/GuessHistory.jsx";
import { Spinner } from "../components/atoms/Spinner.jsx";
import { Button } from "../components/atoms/Button.jsx";
import { useMediaQuery } from "../hooks/useMediaQuery.js";

const FILTER_KEY = "heardle:artistFilter";
const EMAIL_FLAG_KEY = "heardle:emailPrompt";
// { roundId, filter } of the last round this browser dealt; see dealtFilter.js.
const DEALT_KEY = "heardle:dealtFilter";
// How many rounds this browser has finished, and which round id the count last
// advanced for (guards a re-render or a StrictMode double effect from
// counting the same round twice). Read by the reveal's email prompt.
const ROUNDS_FINISHED_KEY = "heardle:roundsFinished";
const LAST_FINISHED_ROUND_KEY = "heardle:lastFinishedRound";

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

// A request that has not answered by then is treated as a dropped connection
// and retried; on a flaky mobile network one can hang for minutes otherwise.
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * Every call to the judge: bounded in time, retried only on a dropped
 * connection. Only for calls that are safe to repeat (see act()).
 */
const callJudge = (run) =>
  withRetry(() => withTimeout(run(), REQUEST_TIMEOUT_MS), { shouldRetry: isConnectionError });

/**
 * The artists a round is dealt from. "All" means all the artists this browser
 * loaded: a track whose catalog file failed could not be searched, so it must
 * not be dealt either.
 */
function dealSlugs(filter, artists) {
  return filter.length ? filter : artists.map((a) => a.slug);
}


export function GameContainer() {
  const [catalog, setCatalog] = useState(null);
  const [peaks, setPeaks] = useState({});
  const [loadError, setLoadError] = useState(null);
  // Bumped by the retry button on the load error view to run loading again.
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [artistFilter, setArtistFilter] = useState(() => readStored(FILTER_KEY, []));
  // The filter the current round was dealt with, or null if this browser does
  // not know it (see dealtFilter.js). When the player changes the chips
  // mid-round the new filter waits for the next round: see GameSettings.
  const [dealtFilter, setDealtFilter] = useState(null);
  // The round as the rounds service reports it; see gameServices.js for the
  // shape. The answer (`answerId`) is only there once the round is over.
  const [game, setGame] = useState(null);
  const [roundError, setRoundError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(() => readStored(EMAIL_FLAG_KEY, "pending"));
  // How many rounds this browser has finished; the reveal offers the email
  // form once this passes EMAIL_AFTER_ROUNDS (see player/emailPrompt.js).
  const [roundsFinished, setRoundsFinished] = useState(() => readStored(ROUNDS_FINISHED_KEY, 0));
  // Drives the opening title: it clears on the first play of each round.
  const [hasPlayed, setHasPlayed] = useState(false);

  const [services, setServices] = useState(null);
  const dealing = useRef(false);
  const countedRound = useRef(null);
  // Wide screens have room on both sides of the board; use it instead of
  // leaving the game floating in empty margins.
  const isWide = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    if (catalog) return;
    loadCatalog()
      .then(setCatalog)
      .catch((e) => setLoadError(`No pudimos cargar el catálogo: ${e.message}`));
    // Deliberately not awaited with the catalog: the bars can arrive late, the
    // round cannot.
    loadPeaks(PEAKS_URL).then(setPeaks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadAttempt]);

  // Signing in is one request on a possibly flaky connection: retry it before
  // giving up, and even then leave the player a way to try again. No timeout
  // here, unlike callJudge: a slow sign-in left running while a retry signs in
  // again would create two anonymous players racing for the same stored session.
  useEffect(() => {
    if (!catalog || services) return;
    withRetry(() => getGameServices({ tracks: catalog.tracks }), { shouldRetry: isConnectionError })
      .then(setServices)
      .catch((e) => setLoadError(toRoundError(e).message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, loadAttempt]);

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
    const dealFrom = dealSlugs(filter, catalog.artists);
    setRoundError(null);
    try {
      // Only a dropped connection is worth retrying; a refusal is final.
      // Safe to repeat: an open round is resumed, never dealt twice.
      const round = await callJudge(() => services.rounds.start(dealFrom));
      setHasPlayed(false);
      const dealt = resolveDealtFilter(round, filter, readStored(DEALT_KEY, null));
      if (dealt) writeStored(DEALT_KEY, { roundId: round.id, filter: dealt });
      setDealtFilter(dealt);
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

  // A finished round is already recorded by whoever judged it. Count it once
  // for the email prompt threshold: `game.id` guards a re-render or a
  // StrictMode double effect from counting the same round twice. The ref
  // keeps that guard working when localStorage cannot write.
  useEffect(() => {
    if (!game || !isOver(game)) return;
    if (countedRound.current === game.id) return;
    if (readStored(LAST_FINISHED_ROUND_KEY, null) === game.id) return;
    countedRound.current = game.id;
    const next = nextRoundsFinished(readStored(ROUNDS_FINISHED_KEY, 0), roundsFinished);
    writeStored(ROUNDS_FINISHED_KEY, next);
    writeStored(LAST_FINISHED_ROUND_KEY, game.id);
    setRoundsFinished(next);
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
      setGame(await callJudge(() => run(id, attempts.length)));
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

  /** Returns false when a previous action is still in flight, so the search keeps the pick. */
  function onGuess(track) {
    if (busy) return false;
    act((id, attempt) => services.rounds.guess(id, track.id, attempt));
    return true;
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

  function onRetryLoad() {
    setLoadError(null);
    setLoadAttempt((n) => n + 1);
  }

  if (loadError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-danger">{loadError}</p>
        <Button onClick={onRetryLoad}>Reintentar</Button>
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
  if (game && over) {
    return (
      <ResultReveal
        game={game}
        track={answerTrack(game, tracksById, catalog.artists)}
        onPlayAgain={onPlayAgain}
        peaks={roundPeaks}
        audio={audio}
        roundsFinished={roundsFinished}
        emailPrompt={emailPrompt}
        onSubmitEmail={onSubmitEmail}
        onDismissEmail={onDismissEmail}
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
