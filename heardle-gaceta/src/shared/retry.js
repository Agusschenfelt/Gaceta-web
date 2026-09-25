const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Rejects when `promise` has not settled within `ms`. A hung request on a
 * flaky mobile network may never reject on its own; this turns it into a
 * "timed out" error, which toRoundError reads as a connection failure and
 * withRetry can retry. The request itself is not cancelled, so only wrap
 * calls that are safe to repeat.
 */
export function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms} ms`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/**
 * Retries an async operation with exponential backoff, then rethrows the last
 * error so the caller can tell the player instead of pretending it worked.
 *
 * `sleep` is injectable so tests do not spend real time waiting.
 */
export async function withRetry(
  fn,
  { attempts = 3, baseDelay = 400, sleep = defaultSleep, shouldRetry = () => true } = {}
) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      // A refusal (rate limit, empty selection…) will not change on retry.
      if (!shouldRetry(error)) break;
      if (attempt < attempts - 1) await sleep(baseDelay * 2 ** attempt);
    }
  }
  throw lastError;
}
