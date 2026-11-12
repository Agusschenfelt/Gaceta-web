import { STATUS } from "./engine.js";
import { levelLabel } from "./format.js";

export const SHARE_TITLE = "GACETA Heardle";

const EMOJI = {
  correct: "🟩",
  wrong: "🟥",
  skip: "⬛",
  unused: "⬜",
};

/** One emoji per stage, in order. Never reveals the song. */
export function buildPattern(state) {
  const cells = state.stages.map(() => EMOJI.unused);
  state.attempts.forEach((attempt, i) => {
    if (i >= cells.length) return;
    if (attempt.type === "skip") cells[i] = EMOJI.skip;
    else cells[i] = attempt.correct ? EMOJI.correct : EMOJI.wrong;
  });
  return cells.join("");
}

export function buildShareText({ state, url }) {
  const outcome =
    state.status === STATUS.WON
      ? `${state.attempts.length}/${state.stages.length}`
      : `X/${state.stages.length}`;
  // "3/4" is only comparable inside one level, so the result names it.
  const level = levelLabel(state.level);
  const lines = [`${SHARE_TITLE} ${outcome}${level ? ` · ${level}` : ""}`, buildPattern(state)];
  if (url) lines.push(url);
  return lines.join("\n");
}
