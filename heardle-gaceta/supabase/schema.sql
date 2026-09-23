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
-- Mirrors of the client rules, change both together:
--   stages [0.5, 1, 3, 8] and score = 4 - stage  ↔ STAGES / scoreFor in src/game/engine.js
--   5 games minimum, ranked by average           ↔ MIN_GAMES / rankPlayers in src/leaderboard/ranking.js
--   alias 2–16 chars, explicit letter set          ↔ ALIAS_SHAPE in src/player/playerIdentity.js
--   ranked = all artists or at least 3            ↔ isRankedSelection in src/leaderboard/ranking.js
--
-- Known limit: someone who plays every song can fingerprint the audio files by
-- their bytes. Not stoppable in code; accepted.

create schema if not exists private;

-- ---------------------------------------------------------------- tables

create table if not exists public.players (
  id uuid primary key references auth.users (id) on delete cascade,
  alias text,
  created_at timestamptz not null default now(),
  constraint alias_shape check (
    alias is null or (alias ~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{2,16}$' and alias = btrim(alias))
  )
);

-- Alias letters are spelled out (ASCII plus the Latin-1 and Latin Extended-A
-- letters: á, é, ñ, ü…) instead of [[:alnum:]], whose meaning depends on the
-- database locale. Same set as ALIAS_SHAPE in src/player/playerIdentity.js.
-- Re-created so a project made with the older, locale-dependent check updates.
alter table public.players drop constraint if exists alias_shape;
alter table public.players add constraint alias_shape check (
  alias is null or (alias ~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{2,16}$' and alias = btrim(alias))
);

-- Case-insensitive: "Agus" and "agus" are the same name on a board.
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

-- Whether the round counts for the board: dealt from every artist, or from at
-- least 3 of them. A narrow pool (one artist with 9 songs) makes guessing far
-- easier, so its rounds are played and scored but kept out of the average.
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

-- Words an alias may not contain as a whole word. A starter list: extend with
-- `insert into public.blocked_words values ('...')`. Whole words, not
-- substrings, so "computadora" is not caught by what it happens to contain.
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
    'ranked', r.ranked,
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

-- -------------------------------------------------------------- the game

-- Deals a round, or hands back the one still open. The artist filter only
-- applies to a new round. Avoids the player's last 20 songs when it can.
-- At most 60 new rounds per player per hour. The round is ranked when dealt
-- from every artist (empty filter) or from at least 3 artists that exist.
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
  is_ranked boolean;
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

  is_ranked := cardinality(artists) = 0 or (
    select count(distinct a)
    from unnest(artists) a
    where exists (select 1 from public.tracks t where a = any(t.artist_slugs))
  ) >= 3;

  begin
    insert into public.rounds (player_id, track_id, ranked)
    values (uid, picked, is_ranked)
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

-- ------------------------------------------------------------ the board

-- Players with an alias and at least 5 finished ranked rounds, by average points.
create or replace function public.get_leaderboard(p_limit int default 20)
returns table (alias text, games_played int, total_score int, avg_score float8)
language sql
stable
security definer
set search_path = ''
as $$
  select p.alias, count(*)::int, sum(r.score)::int, avg(r.score)::float8
  from public.rounds r
  join public.players p on p.id = r.player_id
  where p.alias is not null and r.status <> 'playing' and r.ranked
  group by p.id, p.alias
  having count(*) >= 5
  order by avg(r.score) desc, count(*) desc, p.alias
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

-- The caller's own numbers (ranked rounds, the ones the board counts) and alias.
create or replace function public.my_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'alias', (select p.alias from public.players p where p.id = auth.uid()),
    'gamesPlayed', count(r.id),
    'totalScore', coalesce(sum(r.score), 0),
    'avgScore', coalesce(avg(r.score), 0)::float8
  )
  from public.rounds r
  where r.player_id = auth.uid() and r.status <> 'playing' and r.ranked;
$$;

create or replace function public.set_alias(p_alias text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := private.require_player();
  clean text := regexp_replace(btrim(coalesce(p_alias, '')), '\s+', ' ', 'g');
begin
  if clean !~ '^[A-Za-z0-9À-ÖØ-öø-ÿĀ-ž._ -]{2,16}$' then
    raise exception 'invalid_alias' using errcode = '22023';
  end if;
  if exists (
    select 1
    -- Folded to plain ASCII by hand: lower() is locale-dependent and, under
    -- the C locale, leaves Á or Ñ untouched, which would split "PÚTO" into
    -- harmless pieces. Anything else non-ASCII is a separator.
    from regexp_split_to_table(
      translate(
        lower(clean),
        'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÑñÇç',
        'aaaaaaaaaaaaeeeeeeeeiiiiiiiioooooooooouuuuuuuunncc'
      ),
      '[^a-z0-9]+'
    ) token
    join public.blocked_words b on b.word = token
  ) then
    raise exception 'blocked_alias' using errcode = '22023';
  end if;
  begin
    update public.players set alias = clean where id = uid;
  exception when unique_violation then
    raise exception 'alias_taken' using errcode = '23505';
  end;
  return clean;
end;
$$;

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

-- ------------------------------------------------------------ privileges

revoke all on schema private from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;

revoke execute on function
  public.start_round(text[]), public.guess_round(uuid, text, int), public.skip_round(uuid, int),
  public.get_leaderboard(int), public.my_stats(), public.set_alias(text),
  public.subscribe_email(text)
  from public, anon, authenticated;

-- Anonymous sign-ins get the `authenticated` role: that is every player.
grant execute on function
  public.start_round(text[]), public.guess_round(uuid, text, int), public.skip_round(uuid, int),
  public.my_stats(), public.set_alias(text), public.subscribe_email(text)
  to authenticated;
grant execute on function public.get_leaderboard(int) to anon, authenticated;
