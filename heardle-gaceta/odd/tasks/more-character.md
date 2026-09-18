# More character

## Objective

The user's words: "siento que le falta mucha onda". The one-screen pass made the game correct and
compact, and drained its personality on the way. Give it back, in the system's own vocabulary.

## Diagnosis

What the GACETA system owns, and what the game screen was doing with it:

| The system's move | The game screen |
|---|---|
| Inter bold display type, tracking -0.05em, one Instrument Serif italic word | nothing above 20px |
| Acid gold as punctuation for impact | only the progress ring |
| The product is 100% audio | the visuals were deaf to it |

The worst of it: "Adiviná el *tema*", the best typographic asset in the project, got deleted from
the app during the one-screen pass and survived only on the share card. And "0.1 s" — the number
carrying the entire tension of the round — was set like a photo caption.

The `bolder` playbook's rule applies exactly: a flat section is usually one that quietly opts out
of the system's own strongest moves. The fix is amplification, not new effects.

## Tasks

- [x] D1 — The seconds get the display voice: Inter bold at 3.5rem with the unit small and muted.
      This is the one decisive move; everything else stays quiet around it.
- [x] D2 — The title returns as the opening of every round and clears on the first play, so the
      screen gets its display type without paying for it all round. The circle takes the space back.
- [x] D3 — Acid gold on the score in the reveal. The system's punctuation, on the actual reward.
- [x] D4 — Circle cap raised from 20rem to 24rem so it fills the column instead of floating in air.
- [x] D5 — A real `<h1>` (screen-reader only): the page had none at all.
- [x] D6 — The circle's bars stop faking it and read the track's own waveform.

## D6: why not Web Audio

The obvious implementation is an `AnalyserNode`, and it is the wrong one here.
`createMediaElementSource` captures the element's output permanently, so a suspended
`AudioContext` silences the game with no way back. Confirmed on this machine that `ctx.resume()`
simply hangs in a hidden tab — which is also why the visual could not have been verified before
shipping it.

Risking the product on an effect that cannot be verified is a bad trade. So the envelope is
precomputed instead: same result on screen, no effect on playback, works everywhere, and the whole
mapping becomes a pure function with tests.

- `scripts/build-peaks.mjs` → 64 RMS values per clip, normalised per track, 19 KB gzipped for 209.
- `src/audio/waveform.js` → `barHeights(peaks, time, duration)`, 9 tests.
- Missing envelopes degrade to flat bars; the game is unaffected.

## Verification

- 73 tests across 9 files, `npm run build` passes, impeccable detector returns no findings.
- Envelope data confirmed live: 209 tracks, 64 values each, and `barHeights` returns different,
  varying bars at 2s, 6s and 11s of the same track.
- One-screen contract holds at 375x667, 360x640, 390x844, 430x932, 448x707, with the search input
  landing exactly on the frame edge (0px over) at every size.
- Headline and the big number confirmed by eye at zoom: the reported 2px is line-box, not glyph
  clipping.

The detector caught a real defect: the bars animated `height`, forcing layout on five elements
every frame. Now `scaleY` with `origin-bottom`.

## Not verified

Nobody has heard the bars move with audio. Chrome will not play audio in a hidden tab, so this
needs a human with the tab in front of them.

## Next step

The user listens to a round and says whether it has onda now.
