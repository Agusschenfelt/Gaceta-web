# R4 resilience: request timeouts and a retryable start

## Objective

Close the two resilience advisories from review `review-ed53e0eb01541f2d` (2026-09-24):

- `R4-act-no-timeout` — `act()` awaits the Supabase RPC with no timeout; a hung request keeps
  `busy` on until the browser gives up, which can take minutes on mobile.
- `R4-services-init-fatal` — sign-in runs once with no retry; any failure replaces the game with a
  terminal message and no way to retry.

## Scope

- `src/shared/retry.js`: pure `withTimeout(promise, ms)` that rejects with a "timed out" error,
  which `toRoundError` already maps to `network` (the one retried code).
- `src/containers/GameContainer.jsx`: every call to the judge (start, guess/skip, board) and the
  services init go through timeout + retry; the load error view gets a "Reintentar" button.
- Tests in `src/shared/retry.test.js`; CLAUDE.md note.

## Constraints

No new dependencies. Retries stay safe: every action carries its attempt count and `start`
resumes an open round. Nothing scrolls; the error view keeps a single centered block.

## Tasks

- [x] T1 `withTimeout` + tests; wire timeout into start/act/board and retry into services init.
- [x] T2 Retry button on the load error view; CLAUDE.md; deploy.

## Checks

TDD off (project config). `npm run test`, `npm run build`,
`npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts` (from repo root).

## Progress

- 2026-09-24: document created.
- 2026-09-24: T1+T2 done. `withTimeout` in `retry.js` (race + clearTimeout; its "timed out"
  message maps to `network`, so withRetry retries it). `GameContainer` routes start, guess/skip,
  board and the services init through `callJudge` (10 s timeout per attempt, retry on connection
  errors only; worst case ~31 s instead of the browser's fetch timeout). Load error view gained
  a "Reintentar" button that bumps `loadAttempt` and reruns whichever load failed. Tests: 4 new in
  `retry.test.js` (fake timers), suite 175/175 in 17 files; build ok; eslint clean.
- 2026-09-24: review `review-f0451846c3a0b952` approved; its R3-init-timeout-concurrent-signin
  (a slow, not dead, sign-in keeps running while the timed-out retry signs in again: two
  anonymous sessions racing for one storage key) was caused by this change, so the init now uses
  withRetry without withTimeout. Game actions keep the timeout (repeating them is safe).
  Open advisories: R3-remembered-filter-unvalidated, R3-container-wiring-untested.
- 2026-09-24: fix `6230f37` deployed; review `review-f0451846`-successor approved. Advisories: R3-init-imports-unverified is a false positive (both identifiers present, build+lint ok); R3-init-hang-no-escape is the accepted tradeoff (a stalled sign-in waits for the browser fetch error, then shows Reintentar); R3-init-no-timeout-untested open (needs jsdom or an extracted init helper). Feature done.
