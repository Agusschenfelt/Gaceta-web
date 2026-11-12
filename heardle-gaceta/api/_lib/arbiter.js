/**
 * The round arbiter: the rules of dealing and judging a round, as pure
 * functions. No environment, no I/O, no clock of its own: the pool, the random
 * source, the clock and the id generator are injected, so every rule is
 * testable and the HTTP layer stays thin.
 *
 * The ladders, the transitions and the score come from src/game/engine.js, the
 * same module local mode uses. This file only adds the pool, the recent-track
 * exclusion and the encrypted round token around it.
 *
 * State is the token payload: { id, trackId, level, stageIndex, attempts,
 * status, createdAt }. Each action returns { state, view, changed }; when
 * `changed` is false the caller hands back the token it received.
 */
import {
  DEFAULT_LEVEL,
  STATUS,
  getStages,
  guess as engineGuess,
  isLevel,
  isOver,
  score,
  skip as engineSkip,
} from "../../src/game/engine.js";

export const MAX_FILTER_ARTISTS = 50;
export const MAX_FILTER_LENGTH = 64;
/** Same window as the database's "last 20 songs"; the client sends them. */
export const MAX_EXCLUDED = 20;

/** An error the client can act on, by the code in src/rounds/roundErrors.js. */
export class ArbiterError extends Error {
  constructor(code) {
    super(code);
    this.name = "ArbiterError";
    this.code = code;
  }
}

const isStringList = (value, max) =>
  Array.isArray(value) &&
  value.length <= max &&
  value.every((v) => typeof v === "string" && v.length <= MAX_FILTER_LENGTH);

/** The game the engine plays, rebuilt from a round state and its pool track. */
function gameOf(state, track) {
  return {
    track,
    level: state.level,
    stages: getStages(state.level),
    stageIndex: state.stageIndex,
    attempts: state.attempts,
    status: state.status,
  };
}

function stateOf(base, game) {
  return { ...base, stageIndex: game.stageIndex, attempts: game.attempts, status: game.status };
}

/** What the client may see. The answer only once the round is over. */
export function viewOf(state, { pool, audioKeyFor }) {
  const track = pool.byId.get(state.trackId);
  const game = gameOf(state, track);
  const over = isOver(game);
  return {
    id: state.id,
    audioKey: audioKeyFor(track.id),
    stages: game.stages,
    level: game.level,
    stageIndex: game.stageIndex,
    attempts: game.attempts,
    status: game.status,
    score: score(game),
    answerId: over ? track.id : null,
    answer: over ? { id: track.id, title: track.title, artistSlugs: [...track.artistSlugs] } : null,
  };
}

/**
 * Deals a round, or hands back the open one.
 *
 * input: { round, artists, level, exclude }, where `round` is the state opened
 * from the client's token (or null). An open round is returned as it is and the
 * level and filter are ignored, like start_round. `exclude` is the ISRCs to
 * avoid; more than MAX_EXCLUDED is rejected (`invalid_filter`) rather than
 * silently truncated, so a buggy client is told.
 */
export function start({ round = null, artists, level, exclude }, deps) {
  const { pool, random, now, newId } = deps;

  if (round && round.status === STATUS.PLAYING && pool.byId.has(round.trackId)) {
    return { state: round, view: viewOf(round, deps), changed: false };
  }

  const chosenLevel = level ?? DEFAULT_LEVEL;
  if (!isLevel(chosenLevel)) throw new ArbiterError("invalid_level");

  const wanted = artists ?? [];
  const avoid = exclude ?? [];
  if (!isStringList(wanted, MAX_FILTER_ARTISTS) || !isStringList(avoid, MAX_EXCLUDED)) {
    throw new ArbiterError("invalid_filter");
  }

  const matching = pool.tracks.filter(
    (t) => wanted.length === 0 || t.artistSlugs.some((slug) => wanted.includes(slug)),
  );
  const fresh = matching.filter((t) => !avoid.includes(t.id));
  // Small pool: allow a repeat rather than refuse to play.
  const candidates = fresh.length > 0 ? fresh : matching;
  if (candidates.length === 0) throw new ArbiterError("empty_pool");

  const track = candidates[Math.min(Math.floor(random() * candidates.length), candidates.length - 1)];
  const state = {
    id: newId(),
    trackId: track.id,
    level: chosenLevel,
    stageIndex: 0,
    attempts: [],
    status: STATUS.PLAYING,
    createdAt: now(),
  };
  return { state, view: viewOf(state, deps), changed: true };
}

function act(round, attempt, deps, { check, transition }) {
  if (!round || !deps.pool.byId.has(round.trackId)) throw new ArbiterError("round_not_found");
  if (!Number.isInteger(attempt) || attempt < 0) throw new ArbiterError("invalid_attempt");
  // An attempt count that is not the current one is a replay (the reply was
  // lost and the client retried): it changes nothing.
  if (round.status !== STATUS.PLAYING || attempt !== round.attempts.length) {
    return { state: round, view: viewOf(round, deps), changed: false };
  }
  check?.();
  const track = deps.pool.byId.get(round.trackId);
  const state = stateOf(round, transition(gameOf(round, track)));
  return { state, view: viewOf(state, deps), changed: true };
}

/**
 * One guess. As in guess_round, a replay is answered before the track is
 * looked up, so only a live attempt can fail with `unknown_track`.
 */
export function guess({ round, trackId, attempt }, deps) {
  return act(round, attempt, deps, {
    check: () => {
      if (typeof trackId !== "string" || !deps.pool.byId.has(trackId)) {
        throw new ArbiterError("unknown_track");
      }
    },
    transition: (game) => engineGuess(game, trackId),
  });
}

export function skip({ round, attempt }, deps) {
  return act(round, attempt, deps, { transition: (game) => engineSkip(game) });
}
