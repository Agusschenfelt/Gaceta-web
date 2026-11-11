# Drop Supabase: stateless rounds on Vercel + shared Neon for emails

## Objective
Get the live game dealing rounds again without Supabase. Rounds are arbitrated by stateless Vercel Functions, mp3s are served from Vercel Blob, and email subscribers go to one Neon Postgres shared by every GACETA project (the one Valuto already uses).

## Problem
The Supabase project `heardle-gaceta` is paused (free plan: 2 active projects per owner, both slots taken). Production cannot deal rounds. The difficulty-levels rollout (T4 of `difficulty-levels.md`) is blocked on it.

## Why
- The only data worth keeping is emails, and those should be GACETA-wide, not per game (user, 2026-11-11).
- Rounds do not need a database: the server can carry the round state in an encrypted token.
- Vercel Pro already covers Functions, Blob and Firewall; Neon already exists via the Vercel Marketplace (Valuto).

## Design
- **Track pool on the server:** the function bundles the public catalog (`public/catalog/*.json`, which already holds ISRC, title, artists) and derives `audioKey = HMAC(AUDIO_KEY_SECRET, ISRC)` at runtime, exactly like `scripts/lib/publish.mjs`. No secret mapping file is deployed.
- **Round token:** AES-256-GCM (confidential + authenticated) with `ROUND_TOKEN_SECRET`. Payload: round id, track id, level, stageIndex, attempts, status, createdAt. The client sees only the round view (same shape as today) plus the opaque token. Rules come from `src/game/engine.js` (pure), so local mode and server share them.
- **Open round:** the client keeps the current token in `localStorage` and `start` resumes it while `status === 'playing'`.
- **Recent 20:** client sends recent answer ids (already tracked in local mode) as an exclusion list to `start`.
- **Rate limit:** Vercel Firewall rule on `/api/rounds/*` (replaces the 60/hour SQL limit).
- **Emails:** Neon table `subscribers (id, email, source, created_at)`, unique on `(lower(email), source)`. `POST /api/subscribe` validates, inserts, and sends the welcome via Resend only on a new row (idempotency key kept). Protected with Turnstile (Resend quota and sender reputation are the real exposure now).
- **Errors:** API responds `{ error: '<code>' }` with the existing codes from `roundErrors.js`.

## Accepted limits (stated to the user)
- Reload in incognito gives a new song (no ranking, nothing to win).
- Rate limit is per IP at the firewall, not per player.
- Recent-20 lives in the browser.
- **Token replay (accepted by the user, 2026-11-11):** a stateless token can be re-sent. A script could reuse the stage-0 token to try every song and find the answer by elimination. Firewall rate limit makes it slow. If it ever matters, add a small "used token" table in the shared Neon; the client contract does not change.

## Scope
In: `api/` functions, round token lib + tests, `apiRounds` client adapter, subscribe endpoint, Blob upload + asset URLs + CSP, removal of Supabase code/deps/tests, docs.
Out: unifying Valuto `fans` into `subscribers` (later; `fans` needs name/birth date/city and has `marketing_opt_in`), deleting old Supabase data.

## Constraints
- No new client dependencies. Server/script deps (`@neondatabase/serverless`, `@vercel/blob`) only where justified.
- Code in English, UI copy unchanged, tokens only, one-screen rule.
- No production changes (Blob store, Neon link, env vars, firewall, deploy) without the user's explicit OK.

## Tasks
- [x] T1 Round arbiter: `api/_lib/roundToken.js` + `api/_lib/arbiter.js` (pure, uses engine) + `api/rounds/{start,guess,skip}.js`; tests port the cases of `supabase/tests/secure_rounds.test.sql`. Route: delegated (writer trigger).
- [x] T2 Client: `src/rounds/apiRounds.js`, `gameServices.js` mode switch, token persistence, error mapping; tests. Route: delegated.
- [x] T3 Emails: `subscribers` migration for shared Neon, `api/subscribe.js` (Turnstile verify + Resend welcome, port `message.js`), `board.subscribeEmail` adapter; tests. Route: delegated.
- [x] T4 Audio on Blob: upload script, `assetUrls.js`, CSP in `vercel.json`, `assertSafeConfig` without Supabase. Route: delegated.
- [x] T5 Remove Supabase: deps, `supabase/`, Supabase tests, captcha-on-login, docs (CLAUDE.md). Route: delegated.
- [ ] T6 Rollout (needs user OK): Blob store, connect Neon to the project, env vars, firewall rule, upload audio, deploy, smoke.

## Acceptance criteria
- A round can be played end to end in production; the answer is never in any response while `status === 'playing'`.
- Normal and Difficult ladders and scores unchanged.
- Subscribing stores one row per (email, source) and sends one welcome.
- `npm run test`, `npm run build` and lint pass; no `@supabase/*` left.

## Checks
- TDD: not configured (ordinary functional checks). Runner: vitest (`npm run test`).
- Lint from repo root: `npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts heardle-gaceta/api`.

## Delivery
- Forecast: well over 400 authored lines across T1–T5. Strategy: ask-on-risk (chain strategy to be asked before the slice budget is exceeded).

## Progress
- 2026-11-11: document created after mapping Valuto (Neon via Marketplace, `fans` table, Resend) and the Heardle Supabase surface. User approved the stateless-rounds + shared-Neon direction.

- 2026-11-11: user accepted the token-replay limit. T1 started (delegated writer).
- 2026-11-11: delivery strategy `feature-branch-chain` (user). Feature branch `feat/heardle-drop-supabase`; slice branches `feat/heardle-drop-supabase-t<N>` with PRs into it.
- 2026-11-11 T1 done, commit ccdc896 (slice t1). `api/_lib/{roundToken,arbiter,trackPool,config,http}.js`, `api/rounds/{start,guess,skip}.js` (`export default { fetch }`), shared `scripts/lib/audioKey.mjs`. Pool: static JSON imports of `data/catalog/*` (`ARTIST_FILES` list guarded by a test). Extra API codes `invalid_request`/`payload_too_large`/`method_not_allowed` → map to `unexpected` in T2. Checks: npm run test 252/252 (parent re-ran), eslint clean, `vite build` ok. `npm run build` hangs in prebuild: environmental, 26 mp3 in `audio/` are iCloud "dataless" (Desktop synced to iCloud), reads block on download; also 63 `* 2.mp3` iCloud duplicates. RDD: medium, slice_budget_reached → consent asked (lineage review-32365d11278c4f6a).

- 2026-11-11 T1 native review review-32365d11278c4f6a (medium, 1 lens reliability, user granted): APPROVED and acknowledged (authority burned). Advisory R3-001 (re-export in publish.mjs has no local binding): checked, not a defect — the only in-file use is the property `t.audioKey` (publish.mjs:68). Reviewed boundary advances to ccdc896.
- [x] T1 (checked above).

- 2026-11-11 T2 done (slice t2). `src/rounds/apiRounds.js` (token in `heardle:api:round`, recent ids sent as `exclude`), `src/catalog/recentTracks.js` shared with pickTrack, `fromApiError` in roundErrors, `VITE_ROUNDS_API=true` mode in gameServices (board rejects `local_unavailable` until T3). GameContainer unchanged. Checks: npm run test 266/266 (parent re-ran), eslint clean, `npx vite build` ok. Open for T3: `local_unavailable` copy still mentions Supabase.
- [x] T2 (checked above).

- 2026-11-11 T2 commit 15ed651. RDD assess (base ccdc896): medium, under_budget (373 lines) → pending in slice.

- 2026-11-11: user approved server-only deps `@neondatabase/serverless` and `@vercel/blob` (dev).
- 2026-11-11 T3 done (slice t3). `db/subscribers.sql` (idempotent, unique (email, source)), `api/_lib/subscribe.js` + `api/subscribe.js` (Turnstile verify → insert on conflict do nothing → Resend welcome only on new row; Resend failure never fails the subscription), `api/_lib/welcomeMessage.js` (copy of the Supabase one; original removed in T5), `src/leaderboard/apiAdapter.js` wired into `createApiServices`, `captcha_failed` code + copy, `local_unavailable` copy without Supabase. Checks: npm run test 291/291 (parent re-ran), eslint clean, `npx vite build` ok, neon driver absent from dist. Open: npm warned esbuild install script pending approval (`npm approve-scripts`); T6 must set `DATABASE_URL`, `TURNSTILE_SECRET_KEY`, `RESEND_API_KEY`, `VITE_TURNSTILE_SITE_KEY` and apply `db/subscribers.sql`.
- [x] T3 (checked above).

- 2026-11-11 T3 commit 308023e. Slice T2+T3 native review review-b5226fce7ca08cdd (medium, 1 lens reliability, user granted): APPROVED and acknowledged (burned). Boundary advances to 308023e. Advisories → follow-up task T3b:
  - R3-001: stale token stays in `heardle:api:round` after `round_not_found`. Checked: `start` deals a new round when the token does not open (arbiter.js:93, http.js:71), so no permanent stuck state; still clear the stored token on `round_not_found` in guess/skip and test it.
  - R3-002 (valid): no timeout on the Turnstile and Resend fetches in subscribe.js; add AbortSignal timeouts and a test.
  - R3-003: make `fromApiError` map unknown codes to `unexpected` itself.
- [x] T3b Review advisories R3-001..003. Done: `round_not_found` clears `heardle:api:round` (start/guess/skip); 5 s `AbortSignal.timeout` on Turnstile (→ 403 `captcha_failed`) and Resend (→ warn, still 200); `fromApiError` maps unknown codes (and a server-sent `network`) to `unexpected`, `RoundError` uses `Object.hasOwn`. Checks: npm run test 311/311 (parent re-ran), eslint clean, vite build ok.

- 2026-11-11 T4 done (slice t4). `scripts/upload-audio.mjs` on Vercel Blob (`audio/<key>.mp3` long cache, `audio/peaks.json` 300 s; skip = same pathname + size, `--force`/`--dry`/`--prune`, peaks hold-back kept), `resolveAssetUrls` with `VITE_AUDIO_BASE_URL` in API mode (warns and falls back to `/audio` if missing), `assertSafeConfig` also for `VITE_ROUNDS_API`, CSP adds `*.public.blob.vercel-storage.com` to media/connect. Checks: npm run test 303/303 (parent re-ran), eslint clean, `npx vite build` ok, blob lib absent from dist, upload script refuses without token. Not run against a real store (T6).
- [x] T4 (checked above).

- 2026-11-11 T4 commit 3dbc65a. Native review review-95e5f18df4dd9111 (high: process_boundary via package-lock; 4 lenses; user granted): APPROVED and acknowledged (burned). Boundary advances to 3dbc65a. Advisories → T4b:
  - R2-001/R3-001/R4-002 (valid): 1-year mp3 cache contradicts in-place overwrite on re-encode/--force → go back to 1 day (86400) and fix the comment.
  - R3-002/R4-001 (valid): API mode without `VITE_AUDIO_BASE_URL` builds fine and 404s every audio → fail the build in `assertSafeConfig` when deployed.
  - R2-002: `--prune` deletes any non-peaks object under `audio/`, header says only mp3 → restrict to `.mp3` or fix the comment.
  - R2-003: drop redundant `const stale = staleAudio` alias.
  - R3-003: orchestration test with a mocked blob client (pagination, skip, peaks hold-back, prune pathnames).
- [x] T4b Review advisories of T4. Done: mp3 cache back to 86400; `assertSafeConfig` fails deployed API-mode builds without `VITE_AUDIO_BASE_URL`; prune deletes only stale `.mp3` (batches of 100); alias removed; `runUpload`/`listRemote` injectable + `scripts/upload-audio.test.mjs`. Checks: npm run test 320/320 (parent re-ran), eslint clean, vite build ok, `--dry` without token refuses.
- 2026-11-11 T3b commit f5988d5 (assess: medium, under_budget 168).

- 2026-11-11 T4b commit d2a29d2 (assess: medium, under_budget 382).
- 2026-11-11 T5 done (slice t5), partial on one file. Removed `@supabase/supabase-js`, `supabase/` (schema, tests, edge function, .generated/.temp — verified gone from disk), Supabase services/rounds/adapter/session, `seedSql`/`tracks.sql`, Supabase CSP hosts and ignore entries. `toRoundError` kept (GameContainer uses it). CLAUDE.md rewritten with a "Servidor" section (token, accepted limits, Neon, welcome, Turnstile, Blob, rotation, deploy order, iCloud gotcha); `vercel dev` documented from Vercel docs, not run. Checks: npm run test 301/301 (parent re-ran; drop = removed Supabase tests), eslint clean, vite build ok, no supabase in dist. **Pending:** `.env.example` still lists `VITE_SUPABASE_*` and lacks `ROUND_TOKEN_SECRET` — agents are denied access to `.env*` files by the user's permission settings; the user must edit it by hand.
- [x] T5 (except `.env.example`, pending user).

- 2026-11-11 T5 commit 363d1ff. Native review review-cf13b241973bd127 over 3dbc65a..363d1ff (T3b+T4b+T5; high; 4 lenses; user granted): APPROVED and acknowledged (burned). Boundary advances to 363d1ff. Advisories fixed inline (route: inline, one script + two comments): stale count is .mp3-only for both peaks hold-back and prune (a stray non-mp3 no longer blocks peaks forever; new test), entry-point guard realpaths both sides (symlinked path ran nothing), assertSafeConfig doc fixed, localRounds comment no longer points to the deleted schema. Checks: npm run test 302/302, eslint clean, `upload-audio --dry` without token still refuses (exit 1).

## Next step
User edits `.env.example`; then T6 rollout (needs user OK).
