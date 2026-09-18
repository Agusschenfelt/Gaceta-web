# One-screen layout

## Objective

The whole game fits in a single viewport, on phone and desktop, with **no scrolling anywhere**.
Explicit user requirement: "nono, nada de scroll".

## Problem

Measured on a 1309x707 viewport, with zero attempts played:

| Block | Height |
|---|---|
| header (eyebrow + h1 + paragraph) | 116 px |
| filters (artists + difficulty + pool count) | 145 px |
| game (bar + circle + counter + search + skip) | 525 px |
| footer | 47 px |
| padding + gaps (`pt-8` + `pb-16` + 3x `gap-8`) | 192 px |
| **total** | **1024 px → overflows by 317 px** |

It grows further as attempts accumulate: `GuessHistory` adds an unbounded row per attempt, and
at the end of a round `ResultReveal` + `EmailCapture` + `Leaderboard` all stack below the board.

Root cause: the shell is authored as a document (`min-h-svh`, a vertical stack, `gap-8`), which
declares "at least the viewport" — the opposite of the requirement.

## Approach

The screen is a fixed-height frame; the play circle is the elastic element that absorbs whatever
space the other rows leave. That removes per-breakpoint pixel tuning: settings opening, history
growing, or a short viewport all resolve by resizing the circle, never by scrolling.

Three mutually exclusive views, one screen each: **game**, **result**, **ranking**.

## Constraints

- Keep the GACETA identity: `#0a0a0a` background, acid gold `#dee5a0` used sparingly, Inter tight
  + one Instrument Serif italic word. Colors only via tokens, never a hex in a component.
- No new dependencies.
- Code and identifiers in English, UI copy in neutral Spanish with soft voseo.
- `src/game/engine.js` stays pure and untouched; this is presentation only.
- No commits, no deploy — the user is iterating on UX (2026-09-18).

## Tasks

- [x] T1 — Shell: `App.jsx` to `h-svh` + `overflow-hidden`, safe-area insets, compact header
      (drop the eyebrow, per craft floor it is a hard ban), footer folded into the frame.
      Header and footer merged into one 24px row: wordmark left, esgaceta.com right.
- [x] T2 — `PlayCircle` derives its size from available height instead of `60vw / max-w-[280px]`.
      `aspect-square h-full max-h-80 w-auto max-w-full` settles at min(height, width).
- [x] T3 — `GameBoard` as a flex column: fixed rows (progress, search, skip, history) plus one
      elastic row holding the circle. Seconds counter and skip now share one row.
- [x] T4 — Settings collapse to a summary line (`GameSettings.jsx`), replacing `ArtistFilter.jsx`
      and `DifficultySelect.jsx`, both deleted.
- [x] T5 — `GameContainer` swaps views: game | result | ranking. The result replaces the board.
- [x] T6 — `ResultReveal` fits one screen and offers the ranking; the cover art is its elastic
      element, mirroring the circle.
- [x] T7 — `Leaderboard` becomes the ranking view: capped at 10 rows, absorbs the alias form and
      `EmailCapture`, showing one ask at a time (alias first, then mail).
- [x] T8 — `atoms/Icon.jsx`: authored SVG set at one stroke weight, replacing `✓ ✗ – ✕`.

## Acceptance criteria

- `document.documentElement.scrollHeight <= innerHeight` on every view, at 390x844, 430x932 and
  a desktop viewport, both with an empty history and with the history full (5 attempts on Fácil).
- No horizontal scroll.
- Touch targets >= 44x44 px.
- Keyboard focus order intact; the combobox keeps its ARIA wiring.
- `npm run test` 10/10 and `npm run build` pass.

## Checks

TDD mode: **off** for this work. The project's Vitest runs in a `node` environment and covers
only `engine.js` and `share.js`; there is no jsdom, so components and layout are not unit
testable here. Functional checks are the measured viewport assertions above plus the existing
suite as a regression guard. Runner: `npm run test`.

## Progress

All eight tasks done. Not committed — the user is still iterating on UX.

Verified in Chrome by pinning the frame to each device box and asking whether anything inside it
overflows (the frame is `overflow-hidden`, so overflow means clipped content):

| View | 375x667 | 360x640 | 390x844 | 430x932 | 448x707 |
|---|---|---|---|---|---|
| game, 0 attempts | ok | ok | ok | ok | ok |
| game, 5 attempts | ok | ok | ok | ok | ok |
| result | ok | ok | ok | ok | ok |
| ranking, 10 rows | ok | ok | ok | ok | ok |

`document.documentElement.scrollHeight - innerHeight === 0` throughout. The circle measured 288px
on a 390x844 phone and shrank to 218px on a 360x640 one, confirming it is absorbing the slack.
Ranking worst case: at 360x640 with 10 rows, 211px of free space remain, against ~90px for the
alias form, so the heaviest secondary block still fits.

`npm run test` 10/10, `npm run build` passes, impeccable detector returns no findings.

Two real defects found and fixed during verification:
- `.headline` sets `line-height: .9` in `index.css` *after* `@tailwind utilities`, so it beats
  Tailwind leading utilities on specificity and clipped the serif italic descender by 3px. Needs
  the `!` important modifier (`!leading-snug`) to override.
- The share pattern used `leading-none`; emoji glyphs sit taller than their em box and overflowed
  by 2px.

Measurement gotcha worth keeping: Chrome pauses CSS animations in hidden tabs, so every `.fade-up`
row was frozen at its initial `translateY(6px)` and reported a phantom 6px overflow. Neutralise
with an injected `.fade-up { animation: none !important }` before measuring.

## Next step

Awaiting the user's next UX item. Nothing pending on this one.
