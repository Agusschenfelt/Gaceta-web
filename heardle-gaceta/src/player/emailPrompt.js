/**
 * How many finished rounds it takes before the reveal offers the email form.
 * Asking on the very first result, before the player has any sense of the
 * game, converts worse than waiting until they are hooked.
 */
export const EMAIL_AFTER_ROUNDS = 2;

/**
 * The finished-rounds count after one more round. Takes the larger of the
 * stored and in-memory counts: when localStorage fails (private mode, quota)
 * the stored value stays at 0, and trusting it alone would pin the counter at
 * 1 so the email form would never show. Garbage in storage counts as 0.
 */
export function nextRoundsFinished(stored, inMemory) {
  const safe = (n) => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  return Math.max(safe(stored), safe(inMemory)) + 1;
}

/**
 * Whether the reveal should show the email form right now. `prompt` is
 * `heardle:emailPrompt` as GameContainer already tracks it: once the player
 * said yes (`done`) or no (`dismissed`) this stays false forever, regardless
 * of how many more rounds they play.
 */
export function shouldAskEmail({ roundsFinished, prompt }) {
  return prompt === "pending" && roundsFinished >= EMAIL_AFTER_ROUNDS;
}
