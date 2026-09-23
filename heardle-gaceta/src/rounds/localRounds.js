import { createGame, getStages, guess, skip, isOver, score, stageWon, STATUS } from "../game/engine.js";
import { pickTrack } from "../catalog/pickTrack.js";
import { RoundError } from "./roundErrors.js";

const OPEN_KEY = "heardle:local:round";

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `local-${Date.now()}-${Math.random()}`;
}

function readOpen() {
  try {
    return JSON.parse(localStorage.getItem(OPEN_KEY) ?? "null");
  } catch {
    return null;
  }
}

function writeOpen(value) {
  try {
    if (value) localStorage.setItem(OPEN_KEY, JSON.stringify(value));
    else localStorage.removeItem(OPEN_KEY);
  } catch {
    /* storage unavailable: the round just will not survive a reload */
  }
}

/** The same shape `private.round_view` returns in supabase/schema.sql. */
function view(id, game) {
  const over = isOver(game);
  return {
    id,
    audioKey: game.track.audioKey,
    stages: game.stages,
    stageIndex: game.stageIndex,
    attempts: game.attempts,
    status: game.status,
    score: score(game),
    answerId: over ? game.track.id : null,
    answer: over
      ? { id: game.track.id, title: game.track.title, artistSlugs: game.track.artistSlugs }
      : null,
  };
}

/**
 * Rounds dealt and judged in the browser, for development without Supabase.
 * It keeps the server's rules so both modes play the same: an open round is
 * resumed after a reload instead of rerolled, the answer only shows once the
 * round is over, and a finished round is handed to `recordRound`.
 *
 * Needs a catalog that carries audio keys, i.e. assets published without
 * AUDIO_KEY_SECRET. With the secret the browser cannot know which audio is
 * which song, which is the point, and only the server can deal.
 */
export function createLocalRounds({ tracks, recordRound }) {
  const playable = tracks.filter((t) => t.audioKey);
  if (playable.length === 0) throw new RoundError("local_unavailable");
  const byId = new Map(tracks.map((t) => [t.id, t]));

  let open = null; // { id, game }
  const saved = readOpen();
  const savedTrack = saved && byId.get(saved.trackId);
  if (savedTrack?.audioKey) {
    open = {
      id: saved.id,
      game: {
        track: savedTrack,
        stages: getStages(),
        stageIndex: saved.stageIndex,
        attempts: saved.attempts,
        status: STATUS.PLAYING,
      },
    };
  }

  function persist() {
    writeOpen(
      open && !isOver(open.game)
        ? {
            id: open.id,
            trackId: open.game.track.id,
            stageIndex: open.game.stageIndex,
            attempts: open.game.attempts,
          }
        : null
    );
  }

  async function act(roundId, attempt, transition) {
    if (!open || open.id !== roundId) throw new RoundError("round_not_found");
    // Same rule as the server: an attempt count that is not the current one is
    // a replay, and a replay changes nothing.
    if (isOver(open.game) || attempt !== open.game.attempts.length) return view(open.id, open.game);
    open = { ...open, game: transition(open.game) };
    persist();
    if (isOver(open.game)) {
      await recordRound({
        trackId: open.game.track.id,
        won: open.game.status === STATUS.WON,
        stageWon: stageWon(open.game),
        attempts: open.game.attempts.length,
      });
    }
    return view(open.id, open.game);
  }

  return {
    mode: "local",

    async start(artistSlugs = []) {
      if (open && !isOver(open.game)) return view(open.id, open.game);
      const track = pickTrack(playable, artistSlugs);
      if (!track) throw new RoundError("empty_pool");
      open = { id: newId(), game: createGame({ track }) };
      persist();
      return view(open.id, open.game);
    },

    guess(roundId, trackId, attempt) {
      if (!byId.has(trackId)) return Promise.reject(new RoundError("unknown_track"));
      return act(roundId, attempt, (g) => guess(g, trackId));
    },

    skip(roundId, attempt) {
      return act(roundId, attempt, (g) => skip(g));
    },
  };
}
