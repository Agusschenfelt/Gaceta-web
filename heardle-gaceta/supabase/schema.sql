-- Heardle GACETA — Supabase schema
--
-- Run in the SQL editor of a fresh project, then paste the generated
-- supabase/.generated/tracks.sql (npm run assets, with AUDIO_KEY_SECRET set).
-- Dashboard: Authentication → enable "Allow anonymous sign-ins" (and a CAPTCHA
-- for them before a public launch).
--
-- Security model: the server is the referee.
--
--   * Identity is Supabase Anonymous Sign-In. A player is `auth.uid()`, signed
--     by Supabase; nobody can act as another player.
--   * Clients never touch a table. RLS is on everywhere with no policies, and
--     every privilege on the tables is revoked from `anon` and `authenticated`.
--     All reads and writes go through the security-definer functions below,
--     which only ever act on the caller's own rows.
--   * The server deals the round and keeps the answer. `tracks` maps each song
--     to its opaque audio file name; clients only learn the audio key of the
--     round they are playing, and the answer once that round is over.
--   * The score is derived from the round, never sent.
--   * An unfinished round is resumed, never rerolled: dropping a hard round to
--     protect your average is not possible.
--
-- Mirror of the client rules, change both together:
--   stages [0.5, 1, 3, 8] and score = 4 - stage  ↔ STAGES / scoreFor in src/game/engine.js
--
-- Ranking retired 2026-09-29 (odd/tasks/remove-ranking.md): the client no longer
-- has a leaderboard, alias form or "ranked" concept. The functions that served
-- them (get_leaderboard, my_stats, set_alias, the first-play backfill) are
-- dropped below. `players.alias`, `rounds.ranked` and `public.blocked_words`
-- are kept as retired data, not dropped — that is irreversible and undecided.
--
-- Known limit: someone who plays every song can fingerprint the audio files by
-- their bytes. Not stoppable in code; accepted.

create schema if not exists private;

-- ---------------------------------------------------------------- tables

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text, -- retired ranking data (see header); kept, no longer settable (set_alias dropped)
  created_at timestamptz not null default now(),
  constraint alias_shape check (
    alias is null or (alias ~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{2,16}$' and alias = btrim(alias))
  )
);

-- Retired ranking data (see header): nothing sets an alias any more, but the
-- check still guards the rows already stored. Letters are spelled out (ASCII
-- plus Latin-1 and Latin Extended-A: á, é, ñ, ü…) instead of [[:alnum:]],
-- whose meaning depends on the database locale. Re-created so a project made
-- with the older, locale-dependent check updates.
alter table public.players drop constraint if exists alias_shape;
alter table public.players add constraint alias_shape check (
  alias is null or (alias ~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{2,16}$' and alias = btrim(alias))
);

-- Retired ranking data: kept so stored aliases stay unique, case-insensitively.
create unique index if not exists players_alias_lower_idx on public.players (lower(alias));

create table if not exists public.tracks (
  id text primary key,                 -- ISRC, what guesses name
  audio_key text not null unique,      -- opaque mp3 file name
  artist_slugs text[] not null,
  title text not null
);

create table if not exists public.rounds (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players (id) on delete cascade,
  track_id text not null references public.tracks (id),
  stage_index int not null default 0 check (stage_index between 0 and 3),
  attempts jsonb not null default '[]'::jsonb,
  status text not null default 'playing' check (status in ('playing', 'won', 'lost')),
  score int generated always as (case when status = 'won' then 4 - stage_index else 0 end) stored,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

-- Retired ranking data (see header): used to say whether the round counted for
-- the board. No longer computed by start_round (stays at the column default);
-- kept, not dropped, because dropping a column is irreversible.
alter table public.rounds add column if not exists ranked boolean not null default true;

-- One open round per player: the rule that makes rerolling impossible.
create unique index if not exists rounds_one_open_per_player
  on public.rounds (player_id) where status = 'playing';
create index if not exists rounds_player_created_idx on public.rounds (player_id, created_at desc);

create table if not exists public.emails (
  id bigserial primary key,
  email text not null unique,
  player_id uuid unique references public.players (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint email_shape check (char_length(email) <= 254 and email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$')
);

-- Retired ranking data (see header): was checked, whole word, by set_alias
-- (dropped) before saving an alias. Kept, not dropped, for the same reason.
create table if not exists public.blocked_words (word text primary key);
insert into public.blocked_words (word) values
  ('puto'), ('puta'), ('trolo'), ('pija'), ('verga'), ('concha'), ('mierda'),
  ('forro'), ('nazi'), ('hitler'), ('gaceta'), ('admin')
on conflict do nothing;

-- ------------------------------------------------------------ audio files

-- The mp3s and their envelopes live in Storage under opaque names
-- (npm run upload-audio). Public so the browser can stream a round's audio by
-- URL; no policy on storage.objects, so nobody can list the bucket and only a
-- known key fetches a file. Skipped where Storage does not exist (tests).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values ('audio', 'audio', true, 1048576, array['audio/mpeg', 'application/json'])
    on conflict (id) do update set
      public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
  end if;
end $$;

-- ------------------------------------------------------------ lock down

alter table public.players enable row level security;
alter table public.tracks enable row level security;
alter table public.rounds enable row level security;
alter table public.emails enable row level security;
alter table public.blocked_words enable row level security;

revoke all on public.players, public.tracks, public.rounds, public.emails, public.blocked_words
  from anon, authenticated;
revoke all on sequence public.emails_id_seq from anon, authenticated;

-- -------------------------------------------------------------- helpers

-- The caller, registered as a player on first use. Refuses anonymous callers
-- without a session: every game action needs a signed identity.
create or replace function private.require_player()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;
  insert into public.players (id) values (uid) on conflict (id) do nothing;
  return uid;
end;
$$;

-- What the client may see of a round. The answer only once it is over, with
-- its title and artists: the reveal must not depend on the browser having
-- loaded that track's catalog file.
create or replace function private.round_view(r public.rounds)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  -- Left join: a round whose track row is gone still returns a round object
  -- (with a null audioKey), never SQL NULL.
  select jsonb_build_object(
    'id', r.id,
    'audioKey', t.audio_key,
    'stages', '[0.5, 1, 3, 8]'::jsonb,
    'stageIndex', r.stage_index,
    'attempts', r.attempts,
    'status', r.status,
    'score', r.score,
    'answerId', case when r.status <> 'playing' then r.track_id end,
    'answer', case when r.status <> 'playing'
      then jsonb_build_object('id', r.track_id, 'title', t.title, 'artistSlugs', t.artist_slugs) end
  )
  from (select 1) one
  left join public.tracks t on t.id = r.track_id;
$$;

-- The caller's round (open or not), locked, or an error. Never someone else's.
create or replace function private.own_round(p_round uuid)
returns public.rounds
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rounds;
begin
  select * into r from public.rounds
  where id = p_round and player_id = private.require_player()
  for update;
  if not found then
    raise exception 'round_not_found' using errcode = 'P0002';
  end if;
  return r;
end;
$$;

-- One attempt on an open round: record it, then win, advance or lose.
create or replace function private.record_attempt(r public.rounds, attempt jsonb, won boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  last_stage constant int := 3;
begin
  update public.rounds
  set attempts = r.attempts || jsonb_build_array(attempt),
      status = case when won then 'won' when r.stage_index = last_stage then 'lost' else 'playing' end,
      stage_index = case when won or r.stage_index = last_stage then r.stage_index else r.stage_index + 1 end,
      finished_at = case when won or r.stage_index = last_stage then now() end
  where id = r.id
  returning * into r;
  return private.round_view(r);
end;
$$;

-- ------------------------------------------------------ ranking (retired)

-- Ranking removed 2026-09-29 (odd/tasks/remove-ranking.md): this one-time
-- first-play backfill for `rounds.ranked` is no longer needed. Dropped so a
-- re-run of this schema also removes it from a live project.
drop function if exists private.backfill_ranked_first_play();

-- -------------------------------------------------------------- the game

-- Deals a round, or hands back the one still open. The artist filter only
-- applies to a new round. Avoids the player's last 20 songs when it can.
-- At most 60 new rounds per player per hour.
create or replace function public.start_round(p_artists text[] default '{}')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_player();
  r public.rounds;
  picked text;
  artists text[] := coalesce(p_artists, '{}');
begin
  select * into r from public.rounds where player_id = uid and status = 'playing';
  if found then
    return private.round_view(r);
  end if;

  if cardinality(artists) > 50 or exists (select 1 from unnest(artists) a where char_length(a) > 64) then
    raise exception 'invalid_filter' using errcode = '22023';
  end if;

  if (select count(*) from public.rounds
      where player_id = uid and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  select t.id into picked
  from public.tracks t
  where (cardinality(artists) = 0 or t.artist_slugs && artists)
    and t.id not in (
      select x.track_id from public.rounds x
      where x.player_id = uid order by x.created_at desc limit 20
    )
  order by random()
  limit 1;

  if picked is null then
    -- Small pool: allow a repeat rather than refuse to play.
    select t.id into picked
    from public.tracks t
    where cardinality(artists) = 0 or t.artist_slugs && artists
    order by random()
    limit 1;
  end if;

  if picked is null then
    raise exception 'empty_pool' using errcode = 'P0002';
  end if;

  begin
    insert into public.rounds (player_id, track_id)
    values (uid, picked)
    returning * into r;
  exception when unique_violation then
    -- A concurrent call opened one first: hand that one back.
    select * into r from public.rounds where player_id = uid and status = 'playing';
  end;
  return private.round_view(r);
end;
$$;

-- Deploy note: changing a signature drops the old one, so a browser still on
-- the previous bundle gets "function not found" until it reloads. Ship the
-- schema and the client together, or keep the old overload until the new
-- bundle is live.
--
-- `p_attempt` is how many attempts the client had seen when it acted. A retry
-- of an attempt the server already recorded (the reply was lost) carries the
-- old count, finds it stale and just gets the current round back: an attempt
-- is never recorded twice.
drop function if exists public.guess_round(uuid, text);
create or replace function public.guess_round(p_round uuid, p_track text, p_attempt int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rounds := private.own_round(p_round);
  correct boolean;
begin
  if p_attempt is null or p_attempt < 0 then
    raise exception 'invalid_attempt' using errcode = '22023';
  end if;
  if r.status <> 'playing' or p_attempt is distinct from jsonb_array_length(r.attempts) then
    return private.round_view(r);
  end if;
  if not exists (select 1 from public.tracks t where t.id = p_track) then
    raise exception 'unknown_track' using errcode = '22023';
  end if;
  correct := p_track = r.track_id;
  return private.record_attempt(
    r,
    jsonb_build_object('type', 'guess', 'trackId', p_track, 'correct', correct),
    correct
  );
end;
$$;

drop function if exists public.skip_round(uuid);
create or replace function public.skip_round(p_round uuid, p_attempt int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.rounds := private.own_round(p_round);
begin
  if p_attempt is null or p_attempt < 0 then
    raise exception 'invalid_attempt' using errcode = '22023';
  end if;
  if r.status <> 'playing' or p_attempt is distinct from jsonb_array_length(r.attempts) then
    return private.round_view(r);
  end if;
  return private.record_attempt(r, jsonb_build_object('type', 'skip'), false);
end;
$$;

-- ------------------------------------------------------ the board (retired)

-- Ranking removed 2026-09-29 (odd/tasks/remove-ranking.md): the client has no
-- leaderboard, alias form or "my stats" view any more. Dropped below so a
-- re-run of this schema also removes them from a live project; the data they
-- read/wrote (players.alias, rounds.ranked, public.blocked_words) is kept.
drop function if exists public.get_leaderboard(int);
drop function if exists public.my_stats();
drop function if exists public.set_alias(text);

-- One address per player; a repeat of either is quietly ignored.
create or replace function public.subscribe_email(p_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_player();
  clean text := lower(btrim(coalesce(p_email, '')));
begin
  if char_length(clean) > 254 or clean !~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;
  insert into public.emails (email, player_id) values (clean, uid) on conflict do nothing;
end;
$$;

-- Welcome email. Flow: insert on public.emails -> this trigger -> pg_net (async HTTP)
-- -> Edge Function `welcome-email` -> Resend. pg_net queues the request and returns at
-- once, so the insert is never slowed. A repeated address fires nothing because
-- subscribe_email inserts with `on conflict do nothing`. Any failure (no pg_net, no Vault,
-- missing secrets, an error) is swallowed: subscribing must never fail because of the
-- welcome. Dynamic SQL keeps this compiling on a plain Postgres without those schemas.
-- Rollout (enable pg_net, create the Vault secrets `welcome_email_url` and
-- `welcome_email_secret`) is documented in CLAUDE.md.
create or replace function private.request_welcome_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  fn_url text;
  fn_secret text;
begin
  if to_regclass('vault.decrypted_secrets') is null
     or not exists (
       select 1 from pg_catalog.pg_proc p
       join pg_catalog.pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'net' and p.proname = 'http_post'
     ) then
    return new;
  end if;

  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1'
    into fn_url using 'welcome_email_url';
  execute 'select decrypted_secret from vault.decrypted_secrets where name = $1'
    into fn_secret using 'welcome_email_secret';
  if fn_url is null or fn_secret is null then
    return new;
  end if;

  execute 'select net.http_post(url := $1, headers := $2, body := $3)'
    using fn_url,
          jsonb_build_object('Content-Type', 'application/json', 'x-welcome-secret', fn_secret),
          jsonb_build_object('email', new.email);
  return new;
exception when others then
  raise warning 'welcome email not requested: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists emails_welcome on public.emails;
create trigger emails_welcome
  after insert on public.emails
  for each row execute function private.request_welcome_email();

-- ------------------------------------------------------------ privileges

revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function
  public.start_round(text[]), public.guess_round(uuid, text, int), public.skip_round(uuid, int),
  public.subscribe_email(text)
  from public, anon, authenticated;

-- Anonymous sign-ins get the `authenticated` role: that is every player.
grant execute on function
  public.start_round(text[]), public.guess_round(uuid, text, int), public.skip_round(uuid, int),
  public.subscribe_email(text)
  to authenticated;
