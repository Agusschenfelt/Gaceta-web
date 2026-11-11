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
- [ ] T1 Round arbiter: `api/_lib/roundToken.js` + `api/_lib/arbiter.js` (pure, uses engine) + `api/rounds/{start,guess,skip}.js`; tests port the cases of `supabase/tests/secure_rounds.test.sql`. Route: delegated (writer trigger).
- [ ] T2 Client: `src/rounds/apiRounds.js`, `gameServices.js` mode switch, token persistence, error mapping; tests. Route: delegated.
- [ ] T3 Emails: `subscribers` migration for shared Neon, `api/subscribe.js` (Turnstile verify + Resend welcome, port `message.js`), `board.subscribeEmail` adapter; tests. Route: delegated.
- [ ] T4 Audio on Blob: upload script, `assetUrls.js`, CSP in `vercel.json`, `assertSafeConfig` without Supabase. Route: delegated.
- [ ] T5 Remove Supabase: deps, `supabase/`, Supabase tests, captcha-on-login, docs (CLAUDE.md). Route: delegated.
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

## Next step
T1 in progress.
