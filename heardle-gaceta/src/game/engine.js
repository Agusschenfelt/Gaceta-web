/**
 * Pure game engine. No React, no DOM, no side effects.
 * A game state is a plain object; every transition returns a new object.
 */

/**
 * Seconds unlocked at each attempt. One ladder for everyone, on purpose:
 * difficulty levels would make two players' "3/4" mean different things, and a
 * result you cannot compare is the one thing this genre cannot afford — the
 * shared score is what gets shared at all. It also keeps the ranking honest,
 * since every row is then the same game.
 */
export const STAGES = Object.freeze([0.5, 1, 3, 8]);

/** Winning on the first listen. */
export const MAX_SCORE = STAGES.length;

export const STATUS = Object.freeze({
  PLAYING: "playing",
  WON: "won",
  LOST: "lost",
});

export function getStages() {
  return [...STAGES];
}

export function createGame({ track }) {
  if (!track || !track.id) throw new Error("createGame requires a track with an id");
  return {
    track,
    stages: getStages(),
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

/** Points for a round: earlier win = more points; a loss scores 0. */
export function score(state) {
  if (state.status !== STATUS.WON) return 0;
  return state.stages.length - state.stageIndex;
}

export function isOver(state) {
  return state.status !== STATUS.PLAYING;
}
