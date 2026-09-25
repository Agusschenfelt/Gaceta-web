# Fair ranking

## Objective

The user, after the scoring explanation: "atacá los dos, y vamos con la de supabase".

1. The score is sent by the browser and trusted. Anyone with the console can post 1000 points.
2. The ranking orders by total points, which rewards volume over skill.

## Decisions

- **The database computes the score.** `games.score` becomes a generated column
  (`won ? 4 - stage_won : 0`) and the client stops sending it. Check constraints tie `won`,
  `stage_won` and `attempts` together, so an impossible round is refused at insert. The local
  adapter derives the score the same way, from the same pure function the engine uses.
- **Ranking by average, with a minimum of games.** `MIN_GAMES = 5`. Qualified players are ordered
  by average desc, then games played desc. Below the minimum you are not on the board, and the
  ranking view tells you how many games you are missing.

## Scope

`engine.js` (`scoreFor`), new `src/leaderboard/ranking.js`, both adapters (+ `getPlayerStats`),
`Leaderboard.jsx`, `GameContainer.jsx`, `supabase/schema.sql`, tests, CLAUDE.md.

Not in scope, known: without auth, a determined player can still insert many legitimate-looking
4-point rounds. Capping that needs a rule (e.g. only the first play of each song counts) that is a
product decision.

## Tasks

- [x] F1 — `scoreFor(won, stageWon)` in the engine; `score(state)` uses it. Tests.
- [x] F2 — `rankPlayers(stats)` + `MIN_GAMES` in `ranking.js`. Tests.
- [x] F3 — Local adapter: derives score, ranks with `rankPlayers`, `getPlayerStats`. Tests.
- [x] F4 — Schema: generated score, constraints, view by average with minimum. Supabase adapter
      stops sending score, orders by average, `getPlayerStats`.
- [x] F5 — Leaderboard shows the average, and "te faltan N partidas" below the minimum.
- [x] F6 — Verify: tests, build, one-screen check of the ranking view.

## Checks

TDD off (no project setting); runner `npm run test`. Plus `npm run build`, CDP screenshot.
The SQL cannot be run here: no Supabase project exists yet.

## Verification

- `npm run test`: 113/113 in 10 files (new `ranking.test.js`, `scoreFor` tests, local adapter
  rewritten: ignores a posted score of 1000, keeps players under the minimum off the board, ranks
  skill over volume). eslint clean, build passes.
- Ranking view seeded with 12 players over CDP at 360×640 and 1440×900: average column, headers,
  "Te falta 1 partida" line; overflow `[]`.

## Not verified

- `supabase/schema.sql` and the Supabase adapter: no project exists, nothing ran against Postgres.
  The generated column, the check constraints and the `having` are unexecuted SQL.

## Next step

Create the Supabase project, run the schema, load `VITE_SUPABASE_*`, and test a round end to end.
