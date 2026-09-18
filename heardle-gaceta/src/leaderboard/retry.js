const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Retries an async operation with exponential backoff, then rethrows the last
 * error so the caller can tell the player instead of pretending it worked.
 *
 * `sleep` is injectable so tests do not spend real time waiting.
 */
export async function withRetry(fn, { attempts = 3, baseDelay = 400, sleep = defaultSleep } = {}) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(baseDelay * 2 ** attempt);
    }
  }
  throw lastError;
}
