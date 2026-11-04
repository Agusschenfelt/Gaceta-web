# Difficulty levels

## Objective
Two levels: **Normal** (default, `[1, 2, 4, 8]`) and **Difficult** (`[0.5, 1, 3, 8]`, today's ladder). New players start on Normal so the first round does not frustrate; Difficult is opt-in for people who know the catalogue.

## Problem / why
User, 2026-11-04: people enter, lose right away and leave. The 0.5 s first stage makes the first guess almost always a miss. The game must first make people want to play, then want to keep playing. The user also likes a hard mode.

Levels were removed on 2026-09-18 (see CLAUDE.md "No hay niveles de dificultad"). Why they come back now and how the old objections are answered:
- Shared result not comparable → the level is shown in the share text and the reveal.
- "Easy paid more" (`score = stages.length - stageIndex`) → both levels have 4 stages, so max score is 4 on both.
- Ranking mixed three games → ranking no longer exists.
- Two levels, not three: below `[1, 2, 4, 8]` the clip starts giving the song away.

## Scope
- Engine: `LEVELS` (`normal`, `hard`), `DEFAULT_LEVEL = "normal"`, stages per level; `scoreFor` unchanged (both ladders have 4 stages).
- Server (`supabase/schema.sql`): `rounds.level` column (check `normal|hard`); `start_round` takes the level (defaulting to `normal`), returns the level's stages and `level` in the round view; guess/skip unaffected beyond the view. Existing rows were played on the hard ladder.
- Local mode mirrors the same rules.
- UI: level selector in `GameSettings` (both layouts), persisted in `localStorage` `heardle:level`; a change mid-round applies from the next round and says so (same as artists).
- Reveal and share text show the level.
- Docs: CLAUDE.md sections on levels, data flow, ports, localStorage, "Dónde tocar".

## Constraints
- Deploy order: a browser with the old bundle calls `start_round(artists)` without a level; it must keep working (gets Normal) until it reloads.
- One-screen rule: no scroll at 360×640 in any view.
- Copy in neutral Spanish with soft voseo; code in English; colours only by tokens; no new dependencies.
- No production rollout (schema apply, Storage, Vercel deploy) without the user's explicit OK.

## Tasks
- [x] T1 Engine + server + local rounds + tests (engine.test.js, rounds tests, `secure_rounds.test.sql`).
- [x] T2 UI: selector in GameSettings, persistence, level in reveal and share (+ share tests); fits 360×640.
- [x] T3 Docs in CLAUDE.md.
- [ ] T4 Rollout (needs user OK): apply schema to prod, deploy client.

## Acceptance criteria
- First visit plays Normal `[1, 2, 4, 8]`; selecting Difficult gives `[0.5, 1, 3, 8]` from the next round.
- Score is 4..1 / 0 on both levels; the share text names the level.
- Old client calling `start_round` without level still works.
- `npm run test`, `npm run build`, lint (`npx eslint --no-ignore heardle-gaceta/src heardle-gaceta/scripts` from repo root) and `supabase/tests/run.sh` pass.

## Checks
- TDD: not configured for this project (ordinary functional checks). Runner: vitest (`npm run test`), SQL: `supabase/tests/run.sh`.

## Routing
- T1–T3: delegated direct (writer trigger: engine, schema, rounds, settings, reveal, share, docs — 2+ non-trivial files).

## Progress
- 2026-11-04: document created; user chose two levels (Normal default + Difficult).
- 2026-11-04 T1 done, commit f5ccfa9. Engine `LEVELS`/`DEFAULT_LEVEL`/`STAGE_COUNT`/`normalizeLevel`; `rounds.level` column (add column default 'hard' backfills existing/open rounds, then default switched to 'normal'); `start_round(p_artists, p_level default 'normal')` with the one-arg overload dropped (no PostgREST ambiguity); `round_view` returns `stages` per level and `level`; local mode mirrors; share text `GACETA Heardle 3/4 · Normal`. Checks: npm run test 189/189, npm run build ok, eslint clean, supabase/tests/run.sh ok (incl. level default, hard ladder, old one-arg call, scores, legacy migration).
- 2026-11-04 T2 done. `GameSettings`: level tags (`Normal`/`Difícil`) in both layouts (panel: "Nivel" label, tags, ladder text, then artists; bar: summary line is `Nivel · artistas · N temas`, right label now "Ajustes", opening adds one label+tag row above the artist chips). Persisted in `heardle:level`; a mid-round change shows the existing "desde la próxima ronda" text, driven by `game.level !== level` (the round view carries its level). Reveal eyebrow shows the level (`Normal · 1 s · intento 1 de 4` / `Era este tema · Difícil`); share text done in T1. Waveform/ring: last stage is 8 s on both levels (< 16 s clip), covered by a new waveform test. Checks: npm run test 190/190, build ok, eslint clean. Not verified in a browser (dev server would hit the production Supabase, whose schema is not applied yet); 360x640 reasoned: at rest the bar is still one row (text truncates), the open state adds one row but the play circle is the elastic element; wide panel has room.
- 2026-11-04 T3 done. CLAUDE.md: levels section replaces "no hay niveles", Dónde tocar, data flow, ports, localStorage, deploy order, test count (190). T1 f5ccfa9, T2 c156ae5.

- 2026-11-04 native review review-1bcca8e72a143f59 (base 69c5dcb, commits f5ccfa9..56b6b0b, 4 lenses, high risk, user granted): APPROVED and acknowledged. Advisories (non-blocking): WARNING R4 rollback re-applying old schema leaves both start_round overloads → ambiguous (add rollback note); WARNING R2/R3 SQL test at secure_rounds.test.sql:203 says "column default" but covers the function default; WARNING R3 mid-round level change in GameContainer.jsx:315 untested; SUGGESTION LEVEL_LABELS in format.js not tied to LEVELS; SUGGESTION run.sh legacy rerun.

- 2026-11-04 review advisories fixed (this commit): rollback note in schema.sql and CLAUDE.md; SQL test split into column-default (60 direct inserts) and function-default checks; pure `hasPendingNextRound` (src/rounds/pendingNextRound.js) extracted from GameContainer with tests; `LEVEL_LABELS` exported and tested against `LEVEL_IDS`. Checks: npm run test 198/198, build ok, eslint clean, supabase/tests/run.sh ok.

- 2026-11-04 browser check (local mode, Chrome, frame 360x640): game view fits with settings closed and open (only the pre-existing 3 px italic overshoot of `p.headline`); first round is Normal at 1 s; choosing Difícil mid-round shows "desde la próxima ronda" and the next round is hard at 0.5 s; loss reveal shows "Era este tema · Normal" and fits. Parent re-ran npm run test: 198/198.

- 2026-11-04 T4 blocked: the production Supabase project is paused (INACTIVE, project domain does not resolve; the live game cannot deal rounds). Restore via Management API returned 403: the free plan allows 2 active projects per owner and both others (ramirovalentin, plataforma-kioscos-db) are in use. Nothing was applied to production. Options left to the user: Supabase Pro, another Supabase account, or migrating off Supabase (Neon would mean rewriting auth, API, storage and the welcome email). User postponed the decision.

## Next step
Blocked on the Supabase decision. Once the project is active: apply schema.sql (single transaction), then `vercel deploy --prod --scope gaceta-97ec2001` from heardle-gaceta/, then smoke. Previously:
T4 (needs the user's explicit OK): apply schema.sql to production first, then deploy the client.
