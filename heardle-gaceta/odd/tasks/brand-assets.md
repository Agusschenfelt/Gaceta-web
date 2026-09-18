# Brand assets

## Objective

Put the real GACETA identity into the game. Until now it borrowed the web's look but drew none of
its marks: the wordmark was set in Inter, the play affordance was a generic triangle, and the page
shipped with no favicon and no share image at all.

The user pointed at the source: the assets live in the GACETA folder, alongside the web project.

## What the assets turned out to be

`Gaceta-web/public/assets/logos/` holds the lockup in black and white, 1920x1080 with transparency.
The isotype is a folded G that already reads as a play triangle — which is why it, and not a
generic glyph, belongs at the centre of this particular game.

## Tasks

- [x] C1 — Extract tight assets: the wordmark alone, the isotype alone, a favicon and a touch icon.
- [x] C2 — Header shows the real wordmark plus "heardle" in the serif italic, on one baseline.
- [x] C3 — The play circle's glyph becomes the isotype, painted as a CSS mask so it keeps taking
      `currentColor` and following the disabled and loading states.
- [x] C4 — A 1200x630 share card, set in the project's own fonts.
- [x] C5 — Wire favicon, apple-touch-icon, `og:image` and `twitter:card` into `index.html`.

## Decisions

- **The lockup is split, not repeated.** Wordmark in the header, isotype in the play circle. Putting
  the full lockup in the header would show the isotype twice on one screen.
- **Mask, not `<img>`.** An image cannot inherit the token colour or dim with the button's state.
- **The wordmark is cropped so its bottom edge is the letter baseline**, which is what lets
  `items-baseline` align it with the serif italic. A re-export with a different crop breaks that.
- The share card was typeset with the project's real fonts (Inter SemiBold, Instrument Serif
  italic), fetched for the render and discarded. The craft floor rules out substituting an
  installed system face, and neither font was on this machine.

## Verification

- Wordmark loads at its natural 367x64; the isotype mask resolves and renders at 30% of the circle.
- One-screen contract still holds at 375x667, 360x640, 390x844, 430x932 and 448x707.
- `npm run test` 62/62, `npm run build` passes, impeccable detector returns no findings.
- All brand assets total 84 KB after quantising (the share card went 120 KB → 52 KB with no visible
  banding in the ghost isotype).

Two ImageMagick traps worth remembering, both cost an iteration:
- `-draw "text x,y"` places the **baseline** at `y` only when no `-gravity` is active. With gravity
  set it places the top of the box instead, which silently breaks baseline alignment between two
  fonts on the same line.
- The lockup's isotype is taller than its wordmark, so the image's bottom edge is not the text
  baseline. Measuring the wordmark's own bounding box inside the lockup is the only reliable way.

## Open

`og:image` is a relative path because the domain is undecided. Several scrapers do not resolve
relative URLs, so it has to become absolute at deploy. Recorded in `index.html` and CLAUDE.md.

## Next step

Nothing pending here.
