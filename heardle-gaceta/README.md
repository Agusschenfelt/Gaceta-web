# Heardle GACETA

Guess-the-song game built on the GACETA catalog. Single screen, mobile-first, Vite + React + Tailwind. In production the server is the referee: rounds are dealt, judged and scored by stateless Vercel Functions (the round state travels in an encrypted token), and the browser never learns which song is playing until the round ends.

## Setup

```bash
npm install --legacy-peer-deps
npm run dev          # http://localhost:5173 (runs npm run assets first)
npm run test         # vitest: engine, rounds, catalog, build tooling
npm run build        # production build in dist/ (runs npm run assets first)
```

## Environment (`.env`, see `.env.example`; never committed)

| Variable | Used by |
|---|---|
| `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` | `npm run catalog` only |
| `VITE_ROUNDS_API` | `true` = rounds through `api/` (production). Empty = local mode, development only |
| `VITE_AUDIO_BASE_URL` / `VITE_TURNSTILE_SITE_KEY` | Public: Blob base for the mp3s, Turnstile site key |
| `AUDIO_KEY_SECRET` | `npm run assets` and `api/`: opaque audio file names. Required in production |
| `ROUND_TOKEN_SECRET` / `DATABASE_URL` / `TURNSTILE_SECRET_KEY` / `RESEND_API_KEY` | `api/` only (server) |
| `BLOB_READ_WRITE_TOKEN` | `npm run upload-audio` only. Never prefix with `VITE_` |

## Sources are local, not in git

The repository is public, so the audio sources (`audio/<ISRC>.mp3`) and their envelopes (`data/peaks.json`, keyed by ISRC) stay out of it: next to the published files they would give away every answer. Rebuild them with:

```bash
npm run catalog          # Spotify + Deezer → data/catalog/*.json (in git) and audio/ (local)
npm run compress-audio   # 16 s mono 96k, leading silence trimmed
npm run peaks            # data/peaks.json
```

## Publishing audio

```bash
npm run assets           # with AUDIO_KEY_SECRET: .published/ (opaque names)
npm run upload-audio     # syncs .published/ to Vercel Blob (BLOB_READ_WRITE_TOKEN)
npm run upload-audio -- --prune   # after the deploy: remove files under old names
```

Rotating `AUDIO_KEY_SECRET` renames every file: `npm run assets`, `upload-audio`, deploy, `upload-audio -- --prune`. Vercel builds only the catalog (there are no sources there) and the game streams audio from Blob.

## Server

`api/` holds the Vercel Functions (rounds, email subscription). Details in `CLAUDE.md`.

## Theming

Every color, font and radius is a CSS variable in `src/theme/tokens.css`, mapped to Tailwind in `tailwind.config.js` (`bg`, `fg`, `muted`, `accent`, `danger`, `surface`, `border`, `font-sans`, `font-display`). Components never use raw values, so swapping the brand means editing that one file.

## Structure

```
src/game/         pure engine, share text, formatting (unit tested)
src/catalog/      catalog loading, search, random pick (local mode)
src/audio/        useAudioPlayer hook, waveform maths
src/rounds/       rounds port: rounds API client or local stand-in
src/services/     picks the mode (API / local), captcha, asset URLs
src/player/       local player id
src/leaderboard/  email-subscription adapters (API / local)
api/              Vercel Functions: round arbiter, token, subscribe
db/               SQL for the shared Neon (subscribers)
scripts/          catalog, compression, peaks, publish and upload tooling
src/components/   atoms → molecules → organisms (presentational)
src/containers/   GameContainer (state orchestration)
```

## Working on this project

`CLAUDE.md` in this folder is the map for making changes: which file owns which behavior, data contracts, catalog status, known gotchas and the review backlog. Read it before touching code.
