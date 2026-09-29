# Remove the ranking, ask for the email in the reveal

## Objective

Drop the leaderboard (view, alias, "ranked" rules and copy) and move the email
capture to the reveal, where players actually are.

## Problem / why

- The email form only lives inside the leaderboard view, and only after the
  player sets an alias: finish a round → tap the small "Ranking" link → pick an
  alias → then see the email field. Almost nobody gets there, so no emails.
- The ranking needs three rules to be fair (5-game minimum, 3+ artists, first
  play per track) and a "Cómo funciona" panel to explain them. User, 2026-09-28:
  "Lo del ranking es poco claro". User chose "sacar el ranking" over a weekly
  ranking tied to the email.

## Scope

- Client only. Remove `Leaderboard.jsx`, the ranking view and its link in the
  reveal, alias handling, `src/leaderboard/ranking.js`, every "no suma al
  ranking" copy (reveal, artist settings), `repeatUnranked`, and the board
  reads (`getTop`, `getPlayerStats`, `setAlias`). Keep `subscribeEmail` as the
  only remaining port for this area.
- Email capture shows in the reveal once the player has finished at least 2
  rounds (counted in localStorage), while `heardle:emailPrompt` is `pending`.
  Hook: new music from GACETA. Dismiss and done keep working as today.
- Server SQL stays as is for now: the new client simply stops calling the
  ranking functions and ignores `ranked`. Dropping them is T4, after this
  client is in production (see "Orden de despliegue" in CLAUDE.md).

## Constraints

- No new dependencies. Code/comments in English, UI copy neutral Spanish with soft voseo.
- One screen, nothing scrolls: the reveal must fit at 360×640 with the email form.
- Do not touch the game rules, score, audio or the round arbiter.

## Tasks

- [x] T1 Remove the ranking from the client (view, alias, ranked copy, ranking.js, board reads) + tests.
- [x] T2 Email capture in the reveal after 2 finished rounds; fits 360×640.
- [x] T3 CLAUDE.md: remove ranking sections/rows, document the email flow.
- [ ] T4 (needs user go, after deploy) Drop ranking SQL (`get_leaderboard`, `set_alias`, alias/blocked words, `ranked`) from schema + live DB.

## Acceptance

- No "Ranking" link, view, alias form or "suma/no suma al ranking" text anywhere.
- After the 2nd finished round the reveal offers the email; submitting stores it
  (Supabase `subscribe_email` or local), dismissing hides it for good.
- `npm run test`, lint and build pass; reveal fits 360×640.

## Checks

TDD off (project config). `npm run test`, `npm run build`,
`npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts` (from repo root),
manual/CDP check of the reveal at 360×640.

Delivery: forecast is deletion-heavy (~500–700 authored lines, mostly removed);
strategy `ask-on-risk`.

## Progress

- 2026-09-28: document created.
- 2026-09-28 (T1, commit `e7ea6a3`): removed `Leaderboard.jsx`, the `showRanking` view,
  `src/leaderboard/ranking.js` + its test, the alias parts of `playerIdentity.js` (kept
  `getPlayerId`), and the `ranked`/`repeatUnranked` copy and logic in `ResultReveal.jsx` and
  `GameSettings.jsx`. `localAdapter.js`/`supabaseAdapter.js` now only implement
  `subscribeEmail`; `gameServices.js`'s `board` port dropped `getTop`/`getPlayerStats`/`setAlias`.
  `localRounds.js` stopped computing `ranked` (dropped `recordRound`/`hasPlayed`, which existed
  only to feed the leaderboard); the round-history `heardle:local:games` key is gone with it.
  Removed the now-unused `trophy` icon. Tests trimmed accordingly
  (`localAdapter.test.js`, `playerIdentity.test.js`, `localRounds.test.js`); `supabaseRounds.test.js`
  needed no changes (thin RPC wrapper, does not reference ranking). `supabase/tests/smoke.mjs`
  left untouched, it still exercises the live SQL functions.
- 2026-09-28 (T2, commit `b1881ee`): added `src/player/emailPrompt.js`
  (`EMAIL_AFTER_ROUNDS = 2`, pure `shouldAskEmail({ roundsFinished, prompt })`) with node tests.
  `GameContainer.jsx` now counts finished rounds into `heardle:roundsFinished`, guarded against
  double counting (StrictMode / re-render) by `heardle:lastFinishedRound` holding the last
  counted round id. `ResultReveal.jsx` shows `EmailCapture` when `shouldAskEmail` says so, in the
  slot the old "Ranking" link/button used to occupy (removed in T1), keeping the same
  dismiss/done handlers `GameContainer.jsx` already had. Updated `EmailCapture.jsx`'s label to a
  new-music hook: "Dejá tu mail y te avisamos cuando salga música nueva".
- 2026-09-28 (T3): rewrote `heardle-gaceta/CLAUDE.md` — removed the ranking/alias table rows and
  the three ranking-rules paragraphs (min games, 3+ artists, first play) and the CAPTCHA-for-abuse
  note tied to them; replaced with one paragraph pointing here and noting the SQL is untouched,
  pending T4. Documented the new email flow (point 6 of "Flujo de datos", the "Puertos"/
  "localStorage" entries, and new table rows for `emailPrompt.js` and the rounds-finished
  counter). Updated the "dos vistas" (was "tres") layout note and the stale `181/181` test count
  to `142/142`.

Verification run after T1+T2 (from `heardle-gaceta/`, and `npx eslint` from the repo root):
- `npm run test`: 142/142 passed, 18 files.
- `npm run build`: builds clean.
- `npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts`: no output, clean.
- `rg -n -i "ranking|leaderboard|alias|getTop|getPlayerStats" heardle-gaceta/src`: only expected
  hits remain (server-error-code strings in `roundErrors.js` for codes the SQL can still raise,
  the `leaderboard/` adapter file paths themselves, a historical comment in `localAdapter.js`, and
  `antialiased` in `index.css` matching "alias" as a substring).

Left for a human to confirm: the reveal's layout at 360×640 with the email form showing — no
browser available in this pass to check it visually; the flex-column/`shrink-0` structure mirrors
the pattern already used for the game view, but only a real viewport check confirms nothing
clips.

- 2026-09-28 review: slice `3c17aef..448900a` assessed medium, user granted, native review
  (1 lens, reliability) **approved** and acknowledged. Advisory: round counter untested; a storage
  failure could leave the counter stuck. Whole-branch review (from `d7395a7`, 4 lenses, high,
  user granted) also **approved**. Advisory warnings: `EmailCapture` validates the untrimmed
  email; rounds-finished counter on storage failure; `publish-assets.mjs:121` publishes empty
  peaks when missing; `useAudioPlayer` reload with a stale key; stale comments in
  `supabase/schema.sql` (mirror map, alias shape). Not blocking.
- 2026-09-28 review follow-ups (user go): email validated after trim in `EmailCapture.jsx`;
  finished-rounds counter uses `nextRoundsFinished(stored, inMemory)` (new, tested in
  `emailPrompt.test.js`) plus an in-memory ref guard, so a failing localStorage no longer pins it
  at 1; `publish-assets.mjs` no longer writes an empty peaks file when `data/peaks.json` is
  missing (warns instead). 145/145 tests, lint and build ok.
- Unverified: reveal fit at 360×640 with the email form (no browser available).

## Next step

T4, whenever the user wants to drop the ranking SQL — needs their explicit go-ahead, and should
wait until this client is deployed (see "Orden de despliegue" in CLAUDE.md).
