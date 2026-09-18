# Heardle GACETA

Guess-the-song game built on the GACETA catalog. Single screen, mobile-first, Vite + React + Tailwind. Supabase is optional: without it the ranking runs on localStorage.

## Setup

```bash
npm install --legacy-peer-deps
npm run dev        # http://localhost:5173
npm run test       # engine unit tests (vitest)
npm run build      # production build in dist/
```

## Environment (`.env`, see `.env.example`)

| Variable | Used by |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | `npm run catalog` only (never shipped to the browser) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Leaderboard + email capture. Leave empty to use the local adapter |

## Catalog

`npm run catalog` (`scripts/build-catalog.mjs`) reads `data/artists.json`, lists each artist's discography on Spotify, resolves every track on Deezer by ISRC and downloads the 30 s preview into `public/audio/<ISRC>.mp3`. Output: `public/catalog/<slug>.json` + `public/catalog/index.json`; tracks without a preview go to `data/missing.json`.

Flags: `-- --only ramma,valuto` to limit artists, `-- --dry` to skip writes. The run is resumable (audio files and Spotify track metadata are cached).

## Supabase

Run `supabase/schema.sql` in the SQL editor, then set the two `VITE_SUPABASE_*` variables. Tables: `players`, `games`, `emails`; view `leaderboard`. Anonymous access only, see the trust-model note at the top of the file.

## Theming

Every color, font and radius is a CSS variable in `src/theme/tokens.css`, mapped to Tailwind in `tailwind.config.js` (`bg`, `fg`, `muted`, `accent`, `danger`, `surface`, `border`, `font-sans`, `font-display`). Components never use raw values, so swapping the brand means editing that one file.

## Structure

```
src/game/         pure engine + share text (unit tested)
src/catalog/      catalog loading, search, random pick
src/audio/        useAudioPlayer hook
src/player/       anonymous player id + alias (localStorage)
src/leaderboard/  port + Supabase / local adapters
src/components/   atoms → molecules → organisms (presentational)
src/containers/   GameContainer (state orchestration)
```

## Working on this project

`CLAUDE.md` in this folder is the map for making changes: which file owns which behavior, data contracts, catalog status, known gotchas and the review backlog. Read it before touching code.
