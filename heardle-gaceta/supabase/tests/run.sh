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
