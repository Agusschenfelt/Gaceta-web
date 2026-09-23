# Review follow-ups

## Objective

Close every advisory finding of the native review of `feat/heardle-gaceta` (lineage
`review-1f34aef9ef9389b3`, approved 2026-09-23). The user: "dale, arreglá todo".

## The finding that changes the plan

`Agusschenfelt/Gaceta-web` is **public**. Two things in this branch would hand out the full answer
table the moment it is pushed, without playing a single round:

- `audio/<ISRC>.mp3`: the published `<key>.mp3` are byte copies of these.
- `data/peaks.json` keyed by ISRC: the published `peaks.json` holds the very same arrays keyed by
  audio key, so a join on the values maps every key to its ISRC.

Perturbing the published bytes would not help: with labelled sources public, matching by sound is
trivial. The sources have to stay private. The branch was never pushed (only `origin/main` exists
locally), so its history can still be cleaned.

## Decisions

- **Sources out of git, history included.** `audio/` and `data/peaks.json` become local-only
  (git-ignored); every commit of this unpushed branch is rewritten without them (and without the
  old `public/audio/` and ISRC-keyed `public/catalog/peaks.json`). They are reproducible with
  `npm run catalog` + `compress-audio` + `peaks`; `audio-raw/` also stays local.
- **Audio and peaks served from Supabase Storage** (public bucket `audio`, no listing), uploaded
  by `npm run upload-audio` with the service role key from `.env`. Vercel only builds the catalog.
  Local mode (no Supabase) keeps serving from `public/`.
- **Rotation** of `AUDIO_KEY_SECRET` renames every file, which invalidates a pooled
  key → answer table: new secret → `assets` → `upload-audio` → seed → `upload-audio --prune`.
  A table pooled by hashing the audio bytes survives rotation; that is the accepted fingerprint
  limit.

## Tasks

- [x] R1 — Purge audio sources and ISRC peaks from the branch history; git-ignore them.
- [x] R2 — Storage bucket + `upload-audio` script; publish tolerates missing sources (catalog only);
      client audio/peaks URLs by mode; CSP; content-hash comparison instead of size.
- [x] R3 — Idempotent attempts: `p_attempt` on `guess_round` / `skip_round`; retries on network.
- [x] R4 — Reveal never crashes: server returns the answer's title and artists when over; the
      client deals only from artists it loaded.
- [x] R5 — Audio load errors are reported and retryable.
- [x] R6 — Readability: README, stale 15 s comment, magic numbers, duplicated attempt mapping and
      `formatSeconds`, dead import, `SobreNosotrosPage` matchMedia guard.
- [x] R7 — Verify: tests, SQL harness, build, smoke against the real project, browser round.

## Checks

TDD off; `npm run test`, `supabase/tests/run.sh`, `npm run build`, `supabase/tests/smoke.mjs`, CDP.

## Verification (2026-09-23)

- History: `filter-branch` over `d7395a7..HEAD`; diff old→new HEAD is exactly the purged paths; no
  commit of the branch contains them; branch objects all readable. Backup branch deleted after the
  equivalence check. Sources restored locally (431 mp3, 3 byte-identical "… 2.mp3" duplicates
  that had lived untracked in the folder removed).
- 145/145 tests (14 files), SQL harness incl. replay and dropped old signatures, lint (with
  `--no-ignore`: the root config ignores heardle-gaceta/).
- Real project: schema re-applied (new function signatures), bucket `audio` created, 432 files
  uploaded (re-run uploads 0), anon listing returns []. Smoke 23/23 incl. Storage streaming,
  unlistable bucket, replayed attempt, answer details.
- `npm run build`: no mp3 or peaks in dist; no secret values in the bundle. Served with the
  vercel.json headers in Supabase mode: full round, zero CSP violations. With every mp3 request
  failed via CDP: the board says "No pudimos cargar el fragmento…" and the ring stops pulsing.
- Test users removed from the project (0 users, 0 rounds, 431 tracks).

## Found on the way, not ours

- `git fsck` reports missing objects in `main`'s older history (e.g. 3b8c91a, parent of c1d69ab)
  and invalid reflog entries. Not caused by this work (the rewrite only touched this branch, whose
  objects are complete). Likely the repo living in a synced Desktop folder; worth checking before
  relying on this clone.
