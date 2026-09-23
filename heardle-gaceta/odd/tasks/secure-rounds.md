# Secure rounds

## Objective

The user: "quiero que sea seguro el juego, lo van a jugar muchas personas", then "dale, avanzá con
el plan". Make the server the referee before the game goes public.

## Problem (found in the fair-ranking review)

1. **Anyone can rename anyone.** `players` is world-readable and its update policy is
   `using (true)`: with the public anon key you can list every id, post rounds as anyone and
   rename the whole board.
2. **The database trusts the outcome.** The score is derived server-side now, but "I won on the
   first listen" is still whatever the browser says.
3. **The answer ships to the browser.** mp3s are named by ISRC and the catalog maps ISRC → title,
   so the Network tab tells you the song before you hear it. `peaks.json` is keyed the same way.

## Decisions

- **Identity:** Supabase Anonymous Sign-In. The player is `auth.uid()`, signed by Supabase; RLS
  and functions only ever touch the caller's own rows.
- **Rounds live in Postgres.** `start_round`, `guess_round`, `skip_round` (security definer). The
  server picks the track and keeps the answer; no client can read `tracks` or `rounds`, or
  insert into either. The answer is returned only once the round is over.
- **An unfinished round is resumed, never rerolled.** Reloading or changing artists does not deal
  a new song: the artist filter applies from the next round. Otherwise "listen 0.5 s, don't know
  it, reload" would farm the average.
- **Opaque audio names.** `audio_key = HMAC-SHA256(AUDIO_KEY_SECRET, ISRC)`. Sources move out of
  `public/` (`audio/`, `data/catalog/`, `data/peaks.json`); `scripts/publish.mjs` generates
  `public/audio/<key>.mp3`, a catalog without audio paths and peaks keyed by audio key. The
  ISRC → key mapping only exists in the secret and in a generated, git-ignored seed SQL.
- **No secret, no secrets:** without `AUDIO_KEY_SECRET` the key is the ISRC and the catalog
  carries it, so local mode keeps working in dev. A production or Supabase build without the
  secret fails.
- **Limits:** rounds per player per hour, one mail per player, alias checks (length, charset,
  blocked words) in the database.
- **Headers:** `vercel.json` with CSP and the usual hardening headers.

## Honest limit

A determined player can still play all 431 songs, fingerprint each audio file by its bytes and
build a lookup table. That is not stoppable in code; it is an accepted risk for a label's game.
Supabase dashboard settings still to do by hand: enable anonymous sign-ins, and a CAPTCHA for
them before a public launch.

## Tasks

- [x] S1 — Asset pipeline: sources out of `public/`, scripts repointed, `publish.mjs` (HMAC keys,
      stripped catalog, peaks by key, guards, seed SQL). Pure helpers tested.
- [x] S2 — Schema rewrite: anon auth, `tracks`, `rounds`, RPCs, RLS, leaderboard/stat/alias/mail
      functions, rate limit. Tested against a local Postgres with a stubbed `auth` schema.
- [x] S3 — Client rounds port: local (engine) and Supabase (RPC) services, one round view shape.
- [x] S4 — Wire the app: container, board, reveal, audio and peaks by key, filter on next round,
      errors; leaderboard adapter on auth.
- [ ] S5 — `vercel.json` security headers.
- [ ] S6 — Verify: tests, build, local-mode round in the browser, SQL harness, native review.

## Checks

TDD off (no project setting); runner `npm run test`. SQL: `supabase/tests/run.sh` against a
throwaway Postgres 18 in the scratchpad. Build, CDP screenshots, review at the end.

## Progress

Started 2026-09-22.

- S1: sources moved with `git mv` (audio/, data/catalog/, data/peaks.json); `publish-assets.mjs`
  runs as `predev`/`prebuild`/`npm run assets`. Checked: with a secret, 431 files under 22-char
  opaque names and no `audio` field in the public catalog; without it, ISRC names and
  `audio_key` in the catalog; `VITE_SUPABASE_URL` without secret exits 1. 125/125 tests.
  Client bridged to `audioKey` so the game keeps working before S3/S4.
- S2: `supabase/schema.sql` rewritten; `supabase/tests/run.sh` spins a throwaway Postgres 18,
  stubs `auth` + roles with Supabase's default grants, applies the schema twice (re-runnable) and
  runs `secure_rounds.test.sql`: no table readable or writable by anon/authenticated, private
  helpers not callable, no session → `not_authenticated`, resume instead of reroll, answer
  hidden until over, someone else's round → `round_not_found`, win/lose/score, generated score
  and stage check refuse forged rows, `empty_pool`, `invalid_filter`, `rate_limited`, board
  minimum, alias shape/blocked words (whole words)/case-insensitive uniqueness, one normalised
  mail per player. Also loads the generated seed twice (431 tracks). All pass.
  Supabase adapter in the client is now out of date until S3/S4 (local mode unaffected).
- S3/S4: `src/rounds/` (local + Supabase services, coded errors), `src/services/` (picks the
  mode, anonymous sign-in with a persisted session), board adapter on RPCs, container on round
  views (answer from `answerId`), one action in flight at a time, filter waits for the next
  round with a visible note, retries only on connection errors, alias errors shown, client alias
  shape aligned with the database. 141/141 tests. CDP in local mode: a round survives a reload
  (resumed at stage 3 after skip + reload + skip), a lost round reveals the right track; with
  assets published under a secret, local mode refuses with a clear message.
  Not run: the Supabase path end to end (no project; Docker not running for a local stack).
