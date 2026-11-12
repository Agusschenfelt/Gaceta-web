/** Seconds as the game writes them: "0.5", "1", "3", "8". */
export function formatSeconds(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}

export const LEVEL_LABELS = Object.freeze({ normal: "Normal", hard: "Difícil" });

/** The level as the player reads it. A round without a known level has no label. */
export function levelLabel(level) {
  return LEVEL_LABELS[level] ?? null;
}
