# Audio onset trim

## Objective

No round may open with silence. The first stage lasts 0.5s, so a preview that takes 1s to make a
sound spends the player's first guess on nothing, and the player cannot tell it was not their fault.

## Problem

Measured over all 431 mp3s in `public/audio` by decoding the first 8s to mono 8kHz PCM and taking
RMS over 25ms windows (onset = first window reaching 10% of the segment peak):

| | tracks |
|---|---|
| Start with sound | 405 |
| Onset >= 150ms | 26 |
| Onset >= 500ms — the whole first stage is mute | 14 |
| Start fast but fade in under 35% of mean energy | 6 |

Worst case 2.45s (`UYT142400072`). About 1 in 20 rounds is affected.

`peaks.json` cannot measure this: its buckets are 250ms (16s / 64 values) and the first stage is
500ms, so it under-reports. It found 21 tracks where PCM at 25ms finds 26.

## Why fix it in the build, not in the player

The alternative is a per-track `startOffset` in the catalog that the player seeks to. That spreads
new state across the catalog contract, the waveform time mapping and the clip math in the pure
engine — three layers for a defect that belongs to the file. Trimming at encode time costs zero
runtime code and keeps the engine pure.

## Scope

Authorized: `scripts/compress-audio.mjs`, a new pure onset module under `scripts/lib/`, the vitest
`include` so that module can be tested, and regenerating the affected mp3s and their peaks.

Out of scope: the 6 fade-in tracks. They have no silence, they have a soft entrance, and that is
part of the recording. Changing them means loudness normalization, which is a separate decision.

## Constraints

- No new dependencies. ffmpeg is already required by this script.
- Keep the git diff to the affected files, not all 431.
- Stay idempotent: a second run must be a no-op.
- Never trim audible content. A window counts as silent only when it falls under an absolute floor,
  so a genuinely quiet intro is preserved.
- The silence test must be stable under trimming, or the trim never converges. See the correction
  recorded under Progress.
- Cap the trim, so a pathological file cannot be gutted.

## Tasks

- [x] T1 — Pure onset module in `scripts/lib/onset.mjs` with its test, and widen the vitest
      `include` to reach it. Test-first.
- [x] T2 — Wire it into `compress-audio.mjs`: onset of the served file decides whether work is
      needed, onset of the original decides where the cut starts.
- [x] T3 — Regenerate: run the compressor, then rebuild peaks with `--force`, because
      `build-peaks.mjs` skips ids already present in `peaks.json`.
- [x] T4 — Verify by re-measuring the catalog, then `npm run test` and `npm run build`.

## Acceptance criteria

- No track in `public/audio` has an onset at or beyond 150ms.
- Total audible content is preserved: every affected file still holds its clip length of audio.
- A second `npm run compress-audio` reports zero files processed.
- `peaks.json` covers all 431 ids and the trimmed ones changed.
- `npm run test` green, `npm run build` passes.

## Checks

- `npm run test` (vitest, node environment, no jsdom)
- `npm run build`
- Catalog re-measurement with the onset script

## TDD

Enabled for the pure onset module, following the convention this repo already used for the backlog
cleanup. Runner: `npm run test` (vitest). The ffmpeg-driven parts stay verified by measurement, not
by unit tests — there is no jsdom and no process mocking in this project.

## Delivery

Strategy `single-pr`. Forecast well under the 400 authored-line budget: one small module, one test
file, a surgical edit to one script, one config line. The regenerated mp3s and `peaks.json` are
generated artifacts and do not count.

## Progress

- **T1** — `scripts/lib/onset.mjs` plus `onset.test.mjs`, written test-first (RED was the missing
  module, then green). vitest `include` widened to `scripts/**/*.test.mjs` so build tooling can be
  tested where it lives instead of being moved into `src/`.
- **T2** — Wired into `compress-audio.mjs`: `onsetOf(target)` decides whether there is work,
  `onsetOf(raw)` decides where the cut starts, `encode()` takes the offset as `-ss` after `-i` so
  the seek is sample-accurate. A binary-safe `runBinary()` was needed because the existing `run()`
  accumulates stdout as a string, which corrupts PCM.

### Correction: the silence threshold had to become absolute

The first implementation called a window silent when it fell below 10% of the probed segment's peak
*and* below an absolute floor. It trimmed 20 files, and then a second run trimmed `UYB282548653`
again — every run would have re-encoded it, stacking mp3 generation loss.

Cause, measured rather than guessed. That track is a long, very quiet fade-in: over the first 8s of
the original it rises 2 → 145 with a peak of only 699. Trimming moved the probe window, the peak
rose 699 → 1165, the relative threshold rose 70 → 117, and the already-trimmed head read as silent
all over again. A peak-relative threshold is not stable under the very operation it authorizes.

The threshold is now a single absolute floor at ~-60 dBFS (Int16 magnitude 33). Silence is a
property of the signal, not of what happens to sit beside it. That criterion was borrowed from
`build-peaks.mjs`, where normalizing against the track's own peak is correct because the goal there
is drawing comparable bars — the wrong tool for authorizing a destructive cut.

`onset.test.mjs` now carries the regression directly: cutting at the onset must leave no new onset.

- **T3** — Regenerated with `--force`, so the files trimmed under the old relative rule were rebuilt
  from the originals under the new one instead of leaving two criteria mixed in the folder. 13 files
  were cut, between 0.13s and 1.64s. The new rule is markedly more conservative than the old one:
  `UYT142400072` went from -2.29s to -0.58s.

  Re-encoding all 431 changed only 13 files in git, which confirms the encode is deterministic —
  the untouched files came back byte-identical from the same originals and arguments.

  `peaks.json` was rebuilt with `--force`. `build-peaks.mjs` skips ids it already knows, so without
  it the trimmed tracks would have kept stale envelopes. It covers 431 ids, none missing, none
  orphaned, all 64 values long.

- **T4** — Verified.
  - Onset across all 431: **0 tracks at or beyond 150ms**. Acceptance criterion met.
  - A second `npm run compress-audio` processes 0 files. The convergence bug is gone.
  - `npm run test` 93/93 in 9 files. `npm run build` passes.
  - Trimmed files fetched through the dev server decode to exactly 16.000s.
  - Two files hold less than 15.5s of audio (`UY01G2400090` 12.98s, `UY01G2400147` 14.99s). Both
    were already that short in `audio-raw/` and are untouched in git — short Deezer previews, not
    something this change caused. Both still clear the longest stage of 8s.

### What this did not fix

Opening level of the first stage, measured over the 431 catalog tracks:

| First 0.5s | tracks |
|---|---|
| Above -30 dBFS, clearly audible | 421 |
| -40 to -30 dBFS | 5 |
| -50 to -40 dBFS | 3 |
| Below -50 dBFS, inaudible in practice | 2 |

The 14 tracks whose first stage was *fully mute* are now at zero. The 5 weakest still open quietly:
`UYB282548653` at -55.7 dBFS against a -36.0 dBFS body, `QZDA82486332` at -51.1 against -13.3.
These are the long fade-ins. Cutting further would remove audible content, so the honest fix is
per-track gain on the clip — loudness normalization, deliberately out of scope here.

## Next step

Nothing pending in this task. The follow-up worth considering, and the user's call, is loudness
normalization for the 5 tracks that still open below -40 dBFS.
