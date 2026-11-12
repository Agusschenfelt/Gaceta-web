/**
 * Pure game engine. No React, no DOM, no side effects.
 * A game state is a plain object; every transition returns a new object.
 */

/**
 * Seconds unlocked at each attempt, per difficulty level. Two levels, both with
 * four stages and the same 8 s last stage, so scoring is the same on both
 * (`stage_count - stage`) and the ring/clip maths never changes: the last stage
 * is always the longest the player hears while guessing (see CLIP_FILE_SECONDS
 * in src/audio/waveform.js). The level is part of a round and of what gets
 * shared, because a "3/4" on Normal and a "3/4" on Difícil do not mean the same.
 *
 * The server (api/_lib/arbiter.js) imports these same ladders: this is the single source.
 */
export const LEVELS = Object.freeze({
  normal: Object.freeze([1, 2, 4, 8]),
  hard: Object.freeze([0.5, 1, 3, 8]),
});

export const LEVEL_IDS = Object.freeze(Object.keys(LEVELS));

/** What a first visit, and an old client that sends no level, plays. */
export const DEFAULT_LEVEL = "normal";

/** Stages per round, the same on every level. */
export const STAGE_COUNT = 4;

/** Winning on the first listen. */
export const MAX_SCORE = STAGE_COUNT;

export function isLevel(value) {
  return typeof value === "string" && Object.hasOwn(LEVELS, value);
}

/** A level id from untrusted input (storage, props): the default when unknown. */
export function normalizeLevel(value) {
  return isLevel(value) ? value : DEFAULT_LEVEL;
}

export const STATUS = Object.freeze({
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
});

/** A fresh copy of a level's ladder (default level for an unknown one). */
export function getStages(level = DEFAULT_LEVEL) {
  return [...LEVELS[normalizeLevel(level)]];
}

export function createGame({ track, level = DEFAULT_LEVEL }) {
  if (!track || !track.id) throw new Error("createGame requires a track with an id");
  const id = normalizeLevel(level);
  return {
    track,
    level: id,
    stages: getStages(id),
    stageIndex: 0,
    attempts: [],
    status: STATUS.PLAYING,
  };
}

function advance(state, attempt) {
  const attempts = [...state.attempts, attempt];
  const nextIndex = state.stageIndex + 1;
  const lost = nextIndex >= state.stages.length;
  return {
    ...state,
    attempts,
    stageIndex: lost ? state.stageIndex : nextIndex,
    status: lost ? STATUS.LOST : STATUS.PLAYING,
  };
}

export function guess(state, guessedTrackId) {
  if (state.status !== STATUS.PLAYING) return state;
  if (guessedTrackId === state.track.id) {
    return {
      ...state,
      attempts: [...state.attempts, { type: "guess", trackId: guessedTrackId, correct: true }],
      status: STATUS.WON,
    };
  }
  return advance(state, { type: "guess", trackId: guessedTrackId, correct: false });
}

export function skip(state) {
  if (state.status !== STATUS.PLAYING) return state;
  return advance(state, { type: "skip" });
}

export function currentClipSeconds(state) {
  return state.stages[state.stageIndex];
}

export function attemptsUsed(state) {
  return state.attempts.length;
}

/** Stage index (0-based) at which the game was won, or null. */
export function stageWon(state) {
  if (state.status !== STATUS.WON) return null;
  return state.stageIndex;
}

/**
 * Points for a finished round from its outcome alone: earlier win = more
 * points, a loss scores 0. This is the one definition of the score. The
 * server (api/_lib/arbiter.js) calls this too instead of trusting whatever the
 * browser sends. An impossible outcome scores 0.
 */
export function scoreFor(won, stageWon, stageCount = STAGE_COUNT) {
  if (!won || !Number.isInteger(stageWon) || stageWon < 0 || stageWon >= stageCount) return 0;
  return stageCount - stageWon;
}

export function score(state) {
  return scoreFor(state.status === STATUS.WON, state.stageIndex, state.stages.length);
}

export function isOver(state) {
  return state.status !== STATUS.PLAYING;
}
