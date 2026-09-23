# Launch polish — main site ready for the Heardle launch

- Branch: `feat/launch-polish` (worktree `../Gaceta-web-review`, from `origin/main` fe63663)
- Source: Impeccable critique 2026-09-23 (`.impeccable/critique/2026-09-23T15-31-34Z__src.md`), user chose "the 3 P1s".

## Objective

Fans arriving from the Heardle (mostly on phones) must land on a site that looks alive, loads fast and shares cleanly.

## Scope (authorized)

- Shows section: hide past dates, designed empty state, one shared ordering rule.
- Image weight: shrink oversized originals in `public/assets` without visible quality loss.
- Share card: valid 1200x630 image referenced by both `og:image` and `twitter:image`.

Out of scope: P2/minor findings (reduced-motion, 404, intro skip, h1, tap targets, console warnings). Visual identity must not change.

## Checks

- TDD: off (no test runner in the project; source: package.json has only `build` and `lint`).
- Per task: `npm run lint`, `npm run build`, headless Chrome pass on the 5 routes at 1440 and 390.

## Tasks

- [ ] T1 Shows: upcoming-only filter, empty state, shared sort helper (home + artist page).
- [ ] T2 Share card: generate `public/assets/og/gaceta-share.jpg` 1200x630, update `index.html` meta.
- [ ] T3 Images: cap oversized rasters in `public/assets` (long edge 1600px, re-encode), verify transfer size per route.

## Progress / evidence

(filled per task)

## Next step

T1.
