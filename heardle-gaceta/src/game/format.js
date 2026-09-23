/** Seconds as the game writes them: "0.5", "1", "3", "8". */
export function formatSeconds(s) {
  return Number.isInteger(s) ? String(s) : s.toFixed(1);
}
