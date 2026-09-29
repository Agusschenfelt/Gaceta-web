/**
 * How many finished rounds it takes before the reveal offers the email form.
 * Asking on the very first result, before the player has any sense of the
 * game, converts worse than waiting until they are hooked.
 */
export const EMAIL_AFTER_ROUNDS = 2;

/**
 * Whether the reveal should show the email form right now. `prompt` is
 * `heardle:emailPrompt` as GameContainer already tracks it: once the player
 * said yes (`done`) or no (`dismissed`) this stays false forever, regardless
 * of how many more rounds they play.
 */
export function shouldAskEmail({ roundsFinished, prompt }) {
  return prompt === "pending" && roundsFinished >= EMAIL_AFTER_ROUNDS;
}
