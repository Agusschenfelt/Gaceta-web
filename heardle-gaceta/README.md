# Heardle GACETA

Guess-the-song game built on the GACETA catalog. Single screen, mobile-first, Vite + React + Tailwind. In production the server is the referee: rounds are dealt, judged and scored by Postgres functions on Supabase, and the browser never learns which song is playing until the round ends.

## Setup

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173 (runs npm run assets first)
npm run test         # vitest: engine, rounds, ranking, build tooling
npm run build        # production build in dist/ (runs npm run assets first)
supabase/tests/run.sh   # the SQL schema against a throwaway local Postgres
```

## Environment (`.env`, see `.env.example`; never committed)

| Variable | Used by |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | `npm run catalog` only |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | The game (rounds, ranking, mail). Empty = local mode, development only |
| `AUDIO_KEY_SECRET` | `npm run assets`: opaque audio file names. Required with Supabase and in production |
| `SUPABASE_SERVICE_ROLE_KEY` | `npm run upload-audio` only. Never prefix with `VITE_` |
| `SUPABASE_DB_PASSWORD` | Running SQL against the project with `psql` |

## Sources are local, not in git

The repository is public, so the audio sources (`audio/<ISRC>.mp3`) and their envelopes (`data/peaks.json`, keyed by ISRC) stay out of it: next to the published files they would give away every answer. Rebuild them with:

```bash
npm run catalog          # Spotify + Deezer → data/catalog/*.json (in git) and audio/ (local)
npm run compress-audio   # 16 s mono 96k, leading silence trimmed
npm run peaks            # data/peaks.json
```

## Publishing audio

```bash
npm run assets           # with AUDIO_KEY_SECRET: .published/ (opaque names) + supabase/.generated/tracks.sql
npm run upload-audio     # syncs .published/ to the public Storage bucket "audio"
# load supabase/.generated/tracks.sql in the SQL editor (it is the answer key: never share it)
npm run upload-audio -- --prune   # after the seed: remove files under old names
```

Rotating `AUDIO_KEY_SECRET` renames every file; follow the same four steps. Vercel builds only the catalog (there are no sources there) and the game streams audio from Storage.

## Supabase

`supabase/schema.sql` is the whole backend and can be re-run. Enable anonymous sign-ins (and a CAPTCHA for them before launch), run the schema, load the seed. Every table is closed to clients; everything goes through security-definer functions that act only on the caller's rows. `supabase/tests/smoke.mjs` checks a live project end to end. Details in `CLAUDE.md`.

## Theming

Every color, font and radius is a CSS variable in `src/theme/tokens.css`, mapped to Tailwind in `tailwind.config.js` (`bg`, `fg`, `muted`, `accent`, `danger`, `surface`, `border`, `font-sans`, `font-display`). Components never use raw values, so swapping the brand means editing that one file.

## Structure

```
src/game/         pure engine, share text, formatting (unit tested)
src/catalog/      catalog loading, search, random pick (local mode)
src/audio/        useAudioPlayer hook, waveform maths
src/rounds/       rounds port: Supabase RPCs or local stand-in
src/services/     picks the mode, anonymous sign-in, asset URLs
src/player/       alias rules, local player id
src/leaderboard/  ranking rules + Supabase / local board adapters
supabase/         schema, SQL tests, smoke test
scripts/          catalog, compression, peaks, publish and upload tooling
src/components/   atoms → molecules → organisms (presentational)
src/containers/   GameContainer (state orchestration)
```

## Working on this project

`CLAUDE.md` in this folder is the map for making changes: which file owns which behavior, data contracts, catalog status, known gotchas and the review backlog. Read it before touching code.
