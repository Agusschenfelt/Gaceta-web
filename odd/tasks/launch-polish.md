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

- [x] T1 Shows: upcoming-only filter, empty state, shared sort helper (home + artist page).
- [x] T2 Share card: generate `public/assets/og/gaceta-share.jpg` 1200x630, update `index.html` meta.
- [x] T3 Images: cap oversized rasters in `public/assets` (long edge 1600px, re-encode), verify transfer size per route.

## Progress / evidence

- T1 `85af753`: home lists only upcoming dates (none today, so the empty state shows: "Nuevas fechas en camino" + Instagram CTA); artist page uses the same local-date `isUpcoming`. Screenshots checked at 1440 and 390.
- T2 `6f104c5`: `public/assets/og/gaceta-share.jpg` 1200x630 sRGB 18 KB; og + twitter image and alt point to it; served 200 locally.
- T3 `02f9ee9`: 41 files 75 MB -> 12.5 MB (photos max 2000px, covers 1600px). Dev-server transfer: /artistas/ramma 12.0 -> 3.3 MB, /sobre-nosotros 41 -> 20.8 MB desktop / 33 -> 16 MB mobile, /gallery 6.4 -> 1.6 MB desktop. No horizontal overflow, no page errors.
- Checks: `npm run build` OK. `npm run lint` fails with 10 errors that already exist on main in untouched files (FooterGaceta, MusicPlayer, PageTransitionProvider, gallery, SobreNosotros...); none are in files this feature changed.

- Review: RDD assess `medium` (executable change in index.html). The user granted review, lineage `review-10c1dba6e4a5f6c2`, reliability lens: **approved**, acknowledged, authority burned. Two informational suggestions, not applied: R3-001, no automated test for the `showsUtils` boundaries (the project has no test runner); R3-002, `todayISO` uses the visitor's timezone, not the venue's, which is an edge case and still better than the old UTC behavior.

## Next step

User decision: push the branch and open a PR. Remaining weight on /sobre-nosotros comes from ~40 images under 300 KB each, not lazy-loaded. That would be a follow-up (srcset/lazy loading), together with the P2 findings.
