# Backlog cleanup

## Objective

Close the four actionable items in the CLAUDE.md backlog. They are the review's non-blocking
findings: each one is a way the game degrades badly under a failure it does not currently handle,
plus the missing test coverage that would have caught them.

## Scope

The fifth backlog bullet (final brand assets, domain and deploy, Supabase project, tracks with no
Deezer preview) depends on the user, not on code. Out of scope here; it stays in the backlog.

## Tasks

- [x] B1 — `loadCatalog` degrades. Today one missing artist JSON takes the whole catalog down,
      because `Promise.all` rejects on the first failure. Load what resolves, drop what does not,
      and only fail when nothing loaded. An artist whose file failed must not appear in the filter
      chips either, or it offers a selection with no tracks.
- [x] B2 — `useAudioPlayer`: guard against overlapping plays. `play()` calls `stop()` and then
      awaits `audio.play()`, so two fast clicks can interleave and leave two timers running.
      Also surface `ready`, which is computed and never used, so the first click gives feedback
      while the mp3 is still loading instead of feeling dead.
- [x] B3 — `submitGame` failures are swallowed by `.catch(() => {})`. Retry with backoff, and if
      it still fails, say so instead of pretending the round was recorded.
- [x] B4 — Tests for `search.js`, `pickTrack.js`, the `loadCatalog` merge, `playerIdentity.js` and
      the local adapter. All are pure or storage-backed logic, so they run in the existing `node`
      environment with a small `localStorage` stub — no jsdom needed. jsdom stays deferred until
      something actually needs to render a component.

## Constraints

- No new dependencies (the CLAUDE.md rule). The `localStorage` stub is a few lines in the tests.
- `src/game/engine.js` stays pure and untouched.
- Keep the one-screen contract from `one-screen-layout.md`: any new UI (a loading hint, an error
  line) has to fit without scrolling.
- Code and identifiers in English; UI copy in neutral Spanish with soft voseo.
- No commits, no deploy.

## Acceptance criteria

- A catalog with one broken artist file still loads the rest, and that artist is absent from the
  chips. A catalog where every file fails raises an error.
- Rapid repeated play clicks leave exactly one playback and one pending stop timer.
- A failing `submitGame` retries and then reports failure in the UI.
- `npm run test` green, with the new suites covering the above.
- `npm run build` passes and the one-screen checks still hold.

## Checks

TDD: on for B1 and B4, where the modules are testable in the `node` environment — write the
failing test first, then the fix. B2 and B3 touch a React hook and an effect, which this project
cannot unit test without jsdom; they get functional verification in the browser instead.
Runner: `npm run test`.

## Progress

All four done, committed in `81364be` on `feat/heardle-gaceta`.

- **B1** — `Promise.allSettled`; failed artists are dropped from both the pool and the artist list,
  and the whole load only fails when nothing resolved. Written test-first: the new case failed
  against `Promise.all` with the exact 404 the backlog predicted, then went green.
- **B2** — `playIdRef` generation token. `stop()` increments it, `play()` adopts the post-stop
  value, and `finish`, `onplaying`, `ontimeupdate`, the post-await resume and the rAF tick all bail
  when superseded. `ready` now reaches `PlayCircle` as `loading`.
- **B3** — `withRetry` in `src/leaderboard/retry.js`, 3 attempts with exponential backoff, and a
  reported failure with a retry control in the reveal.
- **B4** — 62 tests across 7 files, up from 10 in 1. New suites: `loadCatalog`, `search`,
  `pickTrack`, `playerIdentity`, `localAdapter`, `retry`. No jsdom, no new dependency.

Browser verification (dev server, patched adapter):
- B1 end-to-end: with `valuto.json` forced to 404, the catalog loaded 171 tracks from the other two
  and `valuto` was absent from the chips; unpatched, 209 from three.
- B2: circle reports `aria-busy="true"`, label "Cargando el fragmento", pulsing ring, dimmed glyph.
- B3: exactly 3 attempts, then the error line and a working "Reintentar".
- The new error row does not break the one-screen contract at 375x667, 360x640, 390x844, 430x932
  or 448x707.

`npm run test` 62/62, `npm run build` passes, impeccable detector returns no findings.

Found and fixed while verifying, outside the original scope: between catalog load and the first
round the UI flashed "No hay temas para esa selección" with 209 tracks available — the empty state
was doubling as the default for "no round yet". Now gated on `poolSize === 0`, with a spinner
otherwise.

Third hidden-tab measurement trap of this session, recorded in CLAUDE.md: Chrome throttles
`setTimeout` in background tabs, so the 400ms/800ms backoff actually took 10.3s and 20.7s. It read
as "the retry is broken" until timing the attempts directly.

## Next step

Nothing pending here. The remaining backlog bullet (brand assets, domain and deploy, Supabase,
tracks with no preview) is the user's call.
