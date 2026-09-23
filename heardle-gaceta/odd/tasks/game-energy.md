# Game energy

## Objective

The user's words, looking at the wide layout: "necesito que tenga mucha más onda/energía, mejor
diseño, alguna flasheada". The `more-character` pass fixed the type; the screen still reads as a
grey disc floating in a dim room. Give it a moment people remember, without leaving the GACETA
system (black, white, acid gold as punctuation, Inter + Instrument Serif, noise, no gradients,
no glow, one screen, no new dependencies).

## Diagnosis

- The circle, the whole product, is a flat grey disc with a 2px ring. It says nothing about the
  song, nor about how much of it you have unlocked.
- Missing a guess costs nothing visually: the only feedback is a new row in a list.
- The page background is dead still; the noise is there but inert.
- On wide screens the right column is empty until the first miss.

## The move

**The ring is the song.** The first 8 s of the track's own envelope, drawn as radial ticks around
the circle. The part you have unlocked is lit, the rest waits dim. Every miss or skip unlocks more,
and the new ticks sweep on. While it plays, the playhead turns the ticks it passes acid gold and the
isotype in the centre beats with the loudness. Everything else stays quiet so this reads.

## Scope

Game view only (`PlayCircle`, `GameBoard`, `GuessHistory`, `index.css`, `waveform.js`). Reveal and
ranking untouched. No engine rule changes.

## Tasks

- [x] E1 — `ringTicks(peaks, span, count)` in `waveform.js`, pure and tested.
- [x] E2 — `PlayCircle`: radial waveform ring, unlocked vs locked, playhead in accent, unlock
      sweep, isotype beating with the level. Replaces the grey disc and the 2px ring.
- [x] E3 — A miss shakes the board once. Reduced motion: no shake.
- [x] E4 — Living grain: the noise moves in steps. Reduced motion: still.
- [x] E5 — Wide layout: the right column is the ladder (0.5 / 1 / 3 / 8 s) from the first second,
      filled in with each attempt.
- [x] E6 — Verify: tests, build, detector, one-screen check at 360×640 and desktop.

### Round 2 — "le falta dinamismo, muy duras" (both screens)

The user, after round 1: the result screen is too plain, and both screens feel stiff.

- [x] E7 — Extract the ring into `WaveRing`, shared by game and reveal.
- [x] E8 — Game: headline words rise in, the seconds roll on each new stage, a slow shimmer runs
      through the locked ticks while idle, the ring leans in on hover, the ladder's current row
      gets an accent tick.
- [x] E9 — Reveal as a record: the song plays on arrival, the cover spins inside the ring (16 s),
      the part you needed stays acid gold; tap to stop/restart. Big verdict + acid gold score,
      staggered entrance. The on-screen emoji pattern is replaced by the app's own stage bars
      (the shared text keeps the emoji).
- [x] E10 — Verify both screens at 1440×900 and 360×640.

### Round 3 — action hierarchy

The user: the buttons should invite to play again and to Spotify first, then share, "con más onda".

- [x] E11 — `ActionButton`: display type, 56px tall, white fill wiping across on hover, icon that
      moves (replay turns, arrow lifts). Play again (accent, 1.5× wide) + Spotify (outline) on one
      row; share demoted to a small underlined link with an icon. Tailwind
      `hoverOnlyWhenSupported` so touch screens do not keep the wipe stuck. Verified at 360×640
      and 1440×900 with hover driven over CDP; overflow `[]`, 99/99, build, detector `[]`.

## Checks

TDD: not configured for this project (source: no project/session setting); ordinary checks.
Runner: `npm run test` (vitest). Plus `npm run build`, impeccable detector, one-screen snippet.

## Progress

Started and closed 2026-09-22.

## Verification

- `npm run test`: 99/99 in 9 files (6 new for `ringTicks` / `unlockedTicks`). `eslint src` clean.
  `npm run build` passes. Impeccable detector: `[]`.
- Headless Chrome screenshots at 1440×900 and in 360×640 / 390×844 iframes: ring, ladder and
  headline fit; nothing is cut, the search input stays on the frame edge.
- The unlock sweep was caught mid-animation in the phone capture (accent on the first 4 ticks).

- Commit `77c239e`. RDD assess (`--base-ref HEAD~1 --committed-only`): **medium**
  (`executable_change` on CLAUDE.md), 524 changed lines → deferred to slice; the native review
  runs when the user signs off on the look, so a design iteration does not burn a review.

- Round 2: CDP-driven headless Chrome (`--autoplay-policy=no-user-gesture-required`) skipped
  through a round: result screen caught mid-spin with the accent playhead running, so autoplay and
  the record work; game screen after two skips shows the shimmer and the ladder marker. Overflow
  check `[]` at both sizes, both screens. 99/99 tests, build, eslint, detector `[]`.

## Not verified

- Beating isotype and the miss shake (playhead and record spin were seen in round 2): headless Chrome does
  not load audio and the Claude in Chrome extension was not connected. Needs a human round.

## Next step

The user plays a round in a visible tab and says whether it has the energy they wanted.
