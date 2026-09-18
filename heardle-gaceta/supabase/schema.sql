-- Heardle GACETA — Supabase schema
-- Run in the SQL editor of a fresh project. Anonymous access only (no auth):
-- the client identifies the player with a UUID stored in localStorage.
--
-- Trust model: this is a friends-scale game. The anon key can insert games
-- for any player id and rename any player whose id it knows. Player ids are
-- random UUIDs that never leave the owner's device, which is enough here.

create table if not exists players (
  id uuid primary key,
  alias text unique,
  created_at timestamptz not null default now(),
  constraint alias_length check (alias is null or char_length(alias) between 2 and 16)
);

create table if not exists games (
  id bigserial primary key,
  player_id uuid not null references players (id) on delete cascade,
  track_id text not null,
  won boolean not null,
  stage_won int,
  attempts int not null,
  score int not null,
  created_at timestamptz not null default now()
);

create index if not exists games_player_id_idx on games (player_id);

create table if not exists emails (
  id bigserial primary key,
  email text not null unique,
  player_id uuid references players (id) on delete set null,
  created_at timestamptz not null default now()
);

create or replace view leaderboard as
select
  p.alias,
  count(g.id)::int as games_played,
  coalesce(sum(g.score), 0)::int as total_score,
  coalesce(round(avg(g.score), 2), 0) as avg_score
from players p
join games g on g.player_id = p.id
where p.alias is not null
group by p.id, p.alias
order by total_score desc, games_played asc;

-- Row level security -------------------------------------------------------

alter table players enable row level security;
alter table games enable row level security;
alter table emails enable row level security;

drop policy if exists "anon insert players" on players;
create policy "anon insert players" on players for insert to anon with check (true);

drop policy if exists "anon select players" on players;
create policy "anon select players" on players for select to anon using (true);

drop policy if exists "anon update alias" on players;
create policy "anon update alias" on players for update to anon using (true) with check (true);

drop policy if exists "anon insert games" on games;
create policy "anon insert games" on games for insert to anon with check (true);

drop policy if exists "anon select games" on games;
create policy "anon select games" on games for select to anon using (true);

drop policy if exists "anon insert emails" on emails;
create policy "anon insert emails" on emails for insert to anon with check (true);

-- Emails are write-only for the anon key: no select policy on purpose.

grant select on leaderboard to anon;
