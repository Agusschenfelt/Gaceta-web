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
- [x] T4 `schema.sql` done (drop functions, stop computing `ranked`); applied to the live DB 2026-09-29.

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

- 2026-09-29 (T4, commit `cbda4ee`): dropped `public.get_leaderboard`, `public.my_stats`,
  `public.set_alias` and `private.backfill_ranked_first_play` from `supabase/schema.sql` (`drop
  function if exists ...`, idempotent on a live project) and stopped computing `ranked` in
  `start_round`/`private.round_view`. Kept `players.alias` (+ constraint/index), `rounds.ranked`
  and `public.blocked_words` as retired data, each with a comment saying so — dropping a column or
  a table is irreversible and stays a separate decision. Updated the header SQL↔JS mirror map
  (only the STAGES/score line still applies) and the privileges section. Rewrote
  `supabase/tests/secure_rounds.test.sql` accordingly (dropped the board/alias/backfill test
  blocks, kept mail, added a check that the five retired functions all resolve to nothing via
  `to_regprocedure`) and `supabase/tests/smoke.mjs` (checks `get_leaderboard`/`set_alias`/`my_stats`
  now error, and that the round view carries no `ranked`). `supabase/tests/run.sh` passed against a
  disposable local Postgres, including the schema applied twice and the generated seed (431
  tracks) loading cleanly.
  - Also, unrelated to T4 but flagged by review (commit `226b713`): fixed stale comments/test name
    — `engine.js`'s STAGES comment no longer cites the ranking, `README.md` no longer describes the
    removed alias/ranking modules or counts "ranking" among the tests, and
    `supabaseRounds.test.js`'s first `toRoundError` test was renamed (it claimed to cover "anything
    unknown" when the very next test proves an unrecognised-but-non-network error does NOT fall
    back to `network`).
  - Also (commit `d21ab4e`): two audio-script robustness fixes flagged by review, unrelated to the
    ranking removal — `compress-audio.mjs`'s failure-path restore no longer overwrites an
    already-good, already-trimmed clip with the uncompressed raw when a re-encode fails and a raw
    copy already existed from an earlier run; `upload-audio.mjs` no longer republishes `peaks.json`
    (single fixed name, keyed by audio key) while old audio keys from a secret rotation are still
    published and un-pruned, which would have dropped the envelope entries in-flight rounds on the
    old keys still need. New `scripts/lib/uploadAudio.mjs` (+ tests) holds that decision as pure,
    tested functions.
  - Verification after T4 and the two fixes: `npm run test` 151/151 (19 files, up from 145/18: the
    6 new `uploadAudio.test.mjs` tests), `npm run build` clean, `npx eslint --no-ignore
    heardle-gaceta/src heardle-gaceta/scripts` (from repo root) clean, `supabase/tests/run.sh` ok.
  - **DB apply pending**: this pass only changed `supabase/schema.sql` and its local tests, per
    instructions — it did not touch the live Supabase project. Applying the new schema to
    production is the next step, whenever whoever holds access to that project runs it.

- 2026-09-29 delivery: reveal measured at 360×640 in headless Chrome over CDP (email form ends at
  620px, no page scroll; the reveal headline reports a 4px internal overflow from the italic, not
  visibly clipped). Deployed to production (`vercel deploy --prod`, aliased to
  heardle-gaceta.vercel.app, 200). Then applied `supabase/schema.sql` to the live project with
  `psql`: the four ranking functions are gone, `subscribe_email` stays. `supabase/tests/smoke.mjs`
  against production: all ok; its two anonymous users deleted.

## Next step

Done. Open, outside this feature: CAPTCHA for anonymous sign-ins (needs a Turnstile/hCaptcha
account from the user), and deciding later whether to drop the retired ranking data.
