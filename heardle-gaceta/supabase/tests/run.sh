#!/usr/bin/env bash
# Runs the schema and its tests against a throwaway local Postgres.
# Needs initdb/pg_ctl/psql on PATH. Usage: supabase/tests/run.sh
set -euo pipefail
# macOS: without a valid locale the postmaster refuses to start.
export LC_ALL=C LANG=C
export PGOPTIONS="-c client_min_messages=warning"
here="$(cd "$(dirname "$0")" && pwd)"
tmp="$(mktemp -d)"
port=54329
trap 'pg_ctl -D "$tmp/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$tmp"' EXIT

initdb -D "$tmp/data" -U postgres -A trust --locale=C --encoding=UTF8 >/dev/null
pg_ctl -D "$tmp/data" -o "-p $port -k $tmp -c listen_addresses=''" -l "$tmp/log" -w start >/dev/null \
  || { cat "$tmp/log"; exit 1; }

psql_run() { psql -h "$tmp" -p "$port" -U postgres -v ON_ERROR_STOP=1 -q "$@"; }
psql_run -d postgres -c "create database heardle"
psql_run -d heardle -f "$here/stub_auth.sql"
psql_run -d heardle -f "$here/../schema.sql"
# Twice: the schema has to be safe to re-run on a live project.
psql_run -d heardle -f "$here/../schema.sql"
psql_run -d heardle -f "$here/secure_rounds.test.sql" >/dev/null

# Migration: a project whose rounds table predates levels. Simulate it by
# dropping the column from a loaded schema, leaving an open round behind, then
# re-running the schema: that round must keep the hard ladder it was dealt on.
psql_run -d postgres -c "create database heardle_legacy"
psql_run -d heardle_legacy -f "$here/stub_auth.sql"
psql_run -d heardle_legacy -f "$here/../schema.sql"
psql_run -d heardle_legacy <<'SQL'
insert into auth.users (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.players (id) values ('00000000-0000-0000-0000-0000000000a1');
insert into public.tracks (id, audio_key, artist_slugs, title) values ('L1', 'kl1', '{a}', 'Legacy');
alter table public.rounds drop constraint rounds_level_check;
alter table public.rounds drop column level;
insert into public.rounds (player_id, track_id) values ('00000000-0000-0000-0000-0000000000a1', 'L1');
SQL
psql_run -d heardle_legacy -f "$here/../schema.sql"
psql_run -d heardle_legacy <<'SQL'
do $$
declare r public.rounds;
begin
  select * into r from public.rounds where track_id = 'L1';
  if private.round_view(r) ->> 'level' is distinct from 'hard'
     or private.round_view(r) -> 'stages' is distinct from '[0.5, 1, 3, 8]'::jsonb then
    raise exception 'FAILED: a round that predates levels must keep the hard ladder: %', private.round_view(r);
  end if;
  insert into public.rounds (player_id, track_id, status)
    values ('00000000-0000-0000-0000-0000000000a1', 'L1', 'lost') returning * into r;
  if r.level <> 'normal' then
    raise exception 'FAILED: a new row without a level must be normal, got %', r.level;
  end if;
end $$;
SQL

# The generated seed (npm run assets) has to load into the schema as is.
seed="$here/../.generated/tracks.sql"
if [ -f "$seed" ]; then
  psql_run -d postgres -c "create database heardle_seed"
  psql_run -d heardle_seed -f "$here/stub_auth.sql"
  psql_run -d heardle_seed -f "$here/../schema.sql"
  psql_run -d heardle_seed -f "$seed"
  psql_run -d heardle_seed -f "$seed"
  echo "seed: $(psql_run -d heardle_seed -tAc 'select count(*) from public.tracks') tracks"
fi
echo "supabase tests: ok"
