# Third review fixes

## Objective

Fix the nine advisories of review `review-ef3e21ecd9b3c00c` (approved 2026-09-23). The user:
"arreglá las nueve, incluyendo el ranking (contar solo las rondas con mínimo 3 artistas o todos,
porque los main de GACETA son Ramma, ARA y Valuto; la gente escucha a los tres)".

## Decisions

- **Ranked rounds:** a round counts for the board only when dealt from "Todos" or from at least
  3 distinct artists that exist in the catalog. Narrower rounds are still played and scored, but
  do not feed the average. The server decides (`rounds.ranked`, set in `start_round`); the local
  mode mirrors it; the UI says so before and after the round.
- **Alias charset:** explicit Latin ranges instead of locale-dependent `[[:alnum:]]`, identical on
  client and server, tested under the C locale.

## Tasks

- [x] T1 — Ranked rounds (schema, board/stats, local mode, UI, tests).
- [x] T2 — A guess picked while another is in flight is not lost.
- [x] T3 — Stale anonymous session recovers by signing in again.
- [x] T4 — Alias charset aligned and locale-independent.
- [x] T5 — `compress-audio` never leaves a track missing from `audio/`.
- [x] T6 — Docs and structure: ports doc, stale gotchas, recent limit 20 in both modes,
      `withRetry` out of `leaderboard/`.
- [x] T7 — Verify: tests, SQL harness, lint, schema applied, smoke, browser.

## Checks

TDD off; `npm run test`, `supabase/tests/run.sh`, lint with `--no-ignore`, smoke, CDP.

## Verification (2026-09-23)

- 158/158 tests (16 files); SQL harness incl. ranked rules (one artist, three real artists, an
  unknown slug not counted, stats and board only ranked), accented aliases under the C locale,
  locale-independent blocked-word split; lint with `--no-ignore`.
- Real project: schema re-applied (`rounds.ranked` added, `alias_shape` re-created); smoke 25/25
  twice; test users removed.
- Browser (dev server on the real project): Dazen-only selection shows "No suma al ranking: elegí
  3 artistas o más" and the reveal says "no suma al ranking"; no overflow at 1440×900 or 360×640.
- `compress-audio`: syntax-checked; the decode now sits inside the restore path (not exercised
  with a corrupt file).

## Fourth review round (2026-09-23)

The slice review (`review-11b35d42a8c73096`) and the whole-branch review (`review-b43c6d2e1ca26b44`)
were both approved. Seven advisories fixed in one batch, as agreed with the user ("dale"; no
further review round unless the hook asks):

1. `compress-audio`: restores the original only when this run moved the served file away (my
   previous change could overwrite a trimmed clip with the untrimmed original).
2. Blocked words folded to ASCII by hand before splitting; `el PÚTO` / `Pütá` now blocked (SQL tests).
3. Ranking hint computed from the same artist list the round is dealt from, known slugs only.
4. Clip timer counts only what is left and pauses while the audio buffers.
5. Unknown errors are `unexpected` (not retried); only real connection failures are `network`.
6. Local mode records a finished round before committing it; a failed record can be retried.
7. CLAUDE.md: test scope, 16 s rationale, audio/ not in git in the review notes.

Checks: 160/160 tests, SQL harness, lint (`--no-ignore`), schema re-applied, smoke 25/25 twice,
test users removed.
