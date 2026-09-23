# Ranking: first play per track + explain the ranking

## Objective

A track counts for the ranking only the first time a player plays it, and the
leaderboard view explains how the ranking works.

## Problem / why

Losing a round reveals its track. Next time that track is dealt the player wins
at the first stage, so playing a lot inflates the average (the open item in
CLAUDE.md, "alguien puede cargar muchas rondas legítimas de 4 puntos"). User
chose on 2026-09-23: "Primera vez por tema". Separately, players have no way to
know the ranking rules (average, 5-game minimum, 3+ artists, first play).

## Scope

- Server (`supabase/schema.sql`, `start_round`): a round is ranked only if the
  selection qualifies (existing rule) AND the player has no earlier round with
  that track. Idempotent backfill for existing rows.
- Local mode (`src/rounds/localRounds.js`) mirrors the same rule.
- UI: repeats are revealed only after the round ends (reveal), never mid-round.
- Leaderboard view: a compact "how it works" explanation that respects the
  one-screen, no-scroll rule.
- Docs: CLAUDE.md ranking section (and fix "vista SQL leaderboard" → function
  `get_leaderboard`).

## Constraints

- No new dependencies. Code/comments in English, UI copy neutral Spanish with soft voseo.
- Nothing scrolls, 360×640 must fit.
- Score formula and MIN_GAMES unchanged.

## Tasks

- [x] T1 Server + local rule, backfill, tests (engine/ranking/localRounds tests, `supabase/tests/secure_rounds.test.sql`).
- [x] T2 Reveal copy for a repeated track + leaderboard "how it works" explanation.
- [x] T3 CLAUDE.md update.
- [ ] T4 Apply schema to the live Supabase project (after review).

## Acceptance

- Second round with the same track for the same player → `ranked = false`, not in average / games count.
- Reveal says the track doesn't count because it was already played; nothing mid-round hints it.
- Leaderboard explains: average points per game, 4→1 points by attempt, 0 on loss, 5 games minimum, all artists or 3+, each track counts once, tie → more games.

## Checks

TDD off (project config, see third-review-fixes.md). `npm run test`, `npm run build`,
`npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts` (from repo root),
`supabase/tests/run.sh`.

## Progress

- 2026-09-23: document created.
- 2026-09-23: T1 done. `start_round` in `supabase/schema.sql` now requires, besides the existing
  selection rule, `not exists (select 1 from public.rounds where player_id = uid and track_id =
  picked)` before marking `ranked`; added `private.backfill_ranked_first_play()` (idempotent,
  invoked once at schema load) to fix rows written before this rule, and updated the header
  SQL↔JS mapping comment. Local mode mirrors it: `localAdapter.js` gained `hasPlayed(playerId,
  trackId)` reading `heardle:local:games`; `localRounds.js` takes an injected `hasPlayed(trackId)`
  (defaults to `async () => false` if omitted) and combines it with the selection rule through a
  new pure helper `isRankedRound(selectionRanked, alreadyPlayed)` in `ranking.js`;
  `gameServices.js` wires `hasPlayed` from the local adapter. Tests: added to `ranking.test.js`
  (`isRankedRound`, 3 cases), `localRounds.test.js` (4 cases: repeat stays unranked, disqualifying
  selection skips the history check, qualifying first play ranks, default fallback), and
  `localAdapter.test.js` (`hasPlayed`, 1 case) — `npm run test` went from 160 to 168 passing.
  `supabase/tests/secure_rounds.test.sql`: added a track credited to three artist slugs used
  nowhere else (`SOLO`/`solo1,solo2,solo3`) so a repeat can be forced deterministically despite
  `start_round`'s random pick; covers first play ranked, repeat not ranked, repeat excluded from
  `my_stats`, and the backfill flipping a simulated pre-migration row (twice, to prove it is a
  no-op the second time). `supabase/tests/run.sh` passes end to end, including loading the schema
  twice and the real generated seed (431 tracks).
- 2026-09-23: T2 done. `ResultReveal.jsx` takes a `repeatUnranked` prop, computed in
  `GameContainer.jsx` from `game.ranked === false && isRankedSelection(dealtSlugs, knownSlugs)`
  (i.e. the round is over and the selection alone would have qualified, so the only reason left is
  a repeat) — never derived or shown before the round ends. Copy: "· ya jugaste este tema, no suma
  al ranking" replaces the generic "· no suma al ranking" only in that case. `GameSettings.jsx`
  was already selection-only (`isRankedSelection`, known before playing) and needed no change.
  `Leaderboard.jsx` got a "Cómo funciona" toggle reusing the existing subtitle row (no added
  height): a button with `aria-expanded`/`aria-controls` swaps the ranked-rows list for a bullet
  list of the six rules (average, 4→1→0 by attempt, 5-game minimum, 3+ artists, first play only,
  tie-break) and back; relies on the project's global `:focus-visible` styling for keyboard focus.
- 2026-09-23: T3 done. `CLAUDE.md`: fixed "la vista SQL `leaderboard`" → function `get_leaderboard`
  (it was already a function, not a view — the old text was wrong); added the first-play rule
  paragraph dated 2026-09-23 referencing this document; replaced the old open item (client-side
  scoring abuse, already closed by fair-ranking.md, and the specific "many legitimate 4-point
  rounds" case, now closed by this task) with the remaining one — no CAPTCHA yet on anonymous
  sign-in, so the first-play rule only closes the abuse within one account, not across accounts
  created to farm first plays; updated two rows in "Dónde tocar" and the test count in "Cómo
  verificar un cambio" (160 → 168).
- 2026-09-23: verification — `npm run test`: 168/168 passed (16 files). `npm run build`:
  succeeded (vite build, 114 modules). `npx eslint --no-ignore heardle-gaceta/src
  heardle-gaceta/scripts` (from `Gaceta-web/`): no output, no errors.
  `supabase/tests/run.sh`: ran against a disposable local Postgres 18.4 (initdb/pg_ctl/psql were
  available); printed `supabase tests: ok` after loading the schema twice and the seed. T4 (apply
  to the live Supabase project) is explicitly out of scope for this pass and is left open.

### Product decisions assumed (not asked, flagged here)

- Reveal copy wording ("ya jugaste este tema, no suma al ranking") — the task gave an example
  sentence; shortened to fit the existing single-line label pattern in `ResultReveal.jsx` rather
  than adding a new row (one-screen budget).
- "Cómo funciona" panel content order and exact phrasing of the six rules — condensed from the
  bullet list in the task prompt into short declarative sentences matching the app's existing
  voice; no new rule invented.
- The toggle button reuses the leaderboard's existing subtitle line instead of adding a new row,
  to stay inside the one-screen budget without a browser to verify layout.
- `hasPlayed` defaults to `async () => false` when not supplied to `createLocalRounds`, so a
  caller that forgets to wire it degrades to the pre-existing (selection-only) behavior instead of
  throwing. Only `gameServices.js` calls it in the app; this default only protects other callers
  (tests, future code).
- 2026-09-23: committed 9b2c479. Native review (medium, reliability lens) approved and
  acknowledged (lineage review-be90fce45adb452d). Advisory follow-ups, not blocking:
  R3-local-start-await-race (localRounds.start awaits hasPlayed between the open-round check and
  the assignment → overlapping starts can orphan a round, local mode only) and
  R3-repeat-reveal-derivation-untested (reveal derives "repeat" client-side from dealtFilter; an
  open round dealt under another filter can mislabel the reason). Next: T4, pending user OK.
