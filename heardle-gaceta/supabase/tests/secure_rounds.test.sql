-- Behaviour of supabase/schema.sql, run by supabase/tests/run.sh.
-- Every check raises on failure; the run stops at the first one.

-- ------------------------------------------------------------ harness

create schema t;
grant usage on schema t to anon, authenticated;

create function t.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if ok is not true then raise exception 'FAILED: %', what; end if;
end $$;

-- Runs `stmt` as the current role and requires it to fail with `expected` in the message.
create function t.fails(stmt text, expected text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'FAILED: expected "%" from: %', expected, stmt;
exception when others then
  if sqlerrm like 'FAILED:%' then raise; end if;
  if position(expected in sqlerrm) = 0 then
    raise exception 'FAILED: expected "%" but got "%" from: %', expected, sqlerrm, stmt;
  end if;
end $$;

-- Act as a signed-in player (or as nobody).
create function t.act_as(uid text) returns void language sql as $$
  select set_config('request.jwt.claim.sub', coalesce(uid, ''), false);
$$;

grant execute on all functions in schema t to anon, authenticated;

insert into auth.users (id) values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003');

insert into public.tracks (id, audio_key, artist_slugs, title) values
  ('T1', 'k1', '{a}', 'Uno'), ('T2', 'k2', '{a}', 'Dos'), ('T3', 'k3', '{a,b}', 'Tres'),
  ('T4', 'k4', '{b}', 'Cuatro'), ('T5', 'k5', '{c}', 'Cinco'), ('T6', 'k6', '{c}', 'Seis');

-- ------------------------------------------------ nobody touches tables

set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000001');
select t.fails('select * from public.tracks', 'permission denied');
select t.fails('select * from public.rounds', 'permission denied');
select t.fails('select * from public.players', 'permission denied');
select t.fails('select * from public.emails', 'permission denied');
select t.fails($$insert into public.rounds (player_id, track_id) values ('00000000-0000-0000-0000-000000000001', 'T1')$$, 'permission denied');
select t.fails($$update public.players set alias = 'x'$$, 'permission denied');
select t.fails('select private.round_view(null)', 'permission denied');
reset role;

set role anon;
select t.fails('select public.start_round()', 'permission denied');
select t.check((select count(*) from public.get_leaderboard()) = 0, 'anon can read the (empty) board');
reset role;

set role authenticated;
select t.act_as(null);
select t.fails('select public.start_round()', 'not_authenticated');

-- ------------------------------------------------ dealing and resuming

select t.act_as('00000000-0000-0000-0000-000000000001');
select set_config('t.r1', public.start_round('{a}')->>'id', false);
select t.check(public.start_round('{c}')->>'id' = current_setting('t.r1'),
  'an open round is resumed, and a new filter does not reroll it');
select t.check((public.start_round()->>'answerId') is null, 'the answer is hidden while playing');
select t.check((public.start_round()->'answer') = 'null'::jsonb, 'no answer details while playing');
select t.check((public.start_round()->>'audioKey') like 'k%', 'the round carries its audio key');
select t.check((public.start_round()->>'ranked')::boolean = false, 'a one-artist round is not ranked');
reset role;
select t.check((select track_id from public.rounds where id = current_setting('t.r1')::uuid) in ('T1','T2','T3'),
  'the artist filter picked from artist a');
select set_config('t.answer', (select track_id from public.rounds where id = current_setting('t.r1')::uuid), false);
select set_config('t.wrong', (select id from public.tracks where id <> current_setting('t.answer') order by id limit 1), false);

-- ------------------------------------------------ someone else's round

set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000002');
select t.fails(format('select public.guess_round(%L, %L, 0)', current_setting('t.r1'), current_setting('t.answer')), 'round_not_found');
select t.fails(format('select public.skip_round(%L, 0)', current_setting('t.r1')), 'round_not_found');

-- ------------------------------------------------ playing a round

select t.act_as('00000000-0000-0000-0000-000000000001');
select t.fails(format('select public.guess_round(%L, %L, 0)', current_setting('t.r1'), 'NOPE'), 'unknown_track');
select t.fails(format('select public.skip_round(%L, null)', current_setting('t.r1')), 'invalid_attempt');
select t.fails(format('select public.guess_round(%L, %L, -1)', current_setting('t.r1'), current_setting('t.wrong')), 'invalid_attempt');
select t.check(
  (public.guess_round(current_setting('t.r1')::uuid, current_setting('t.wrong'), 0)->>'stageIndex')::int = 1,
  'a wrong guess advances one stage');
select t.check(
  jsonb_array_length(public.guess_round(current_setting('t.r1')::uuid, current_setting('t.wrong'), 0)->'attempts') = 1,
  'a replayed attempt (lost reply, retried) is not recorded twice');
select t.check(
  (public.skip_round(current_setting('t.r1')::uuid, 1)->>'stageIndex')::int = 2,
  'a skip advances one stage');
select set_config('t.win', public.guess_round(current_setting('t.r1')::uuid, current_setting('t.answer'), 2)::text, false);
select t.check(current_setting('t.win')::jsonb->>'status' = 'won', 'the right guess wins');
select t.check((current_setting('t.win')::jsonb->>'score')::int = 2, 'won on stage 2 scores 2');
select t.check(current_setting('t.win')::jsonb->>'answerId' = current_setting('t.answer'), 'the answer shows once over');
select t.check(jsonb_array_length(current_setting('t.win')::jsonb->'attempts') = 3, 'three attempts recorded');
select t.check(current_setting('t.win')::jsonb->'answer'->>'title' is not null
  and jsonb_array_length(current_setting('t.win')::jsonb->'answer'->'artistSlugs') >= 1,
  'the finished round carries the answer title and artists');
select t.check(
  public.guess_round(current_setting('t.r1')::uuid, current_setting('t.wrong'), 3)->>'status' = 'won',
  'a finished round cannot be changed');
select t.check(public.start_round()->>'id' <> current_setting('t.r1'), 'a finished round makes room for a new one');
select t.check((public.start_round()->>'ranked')::boolean, 'an all-artists round is ranked');
reset role;

-- A loss: four misses.
set role authenticated;
select set_config('t.r2', public.start_round()->>'id', false);
reset role;
select set_config('t.answer2', (select track_id from public.rounds where id = current_setting('t.r2')::uuid), false);
set role authenticated;
select public.skip_round(current_setting('t.r2')::uuid, n) from generate_series(0, 2) n;
select set_config('t.loss', public.skip_round(current_setting('t.r2')::uuid, 3)::text, false);
select t.check(current_setting('t.loss')::jsonb->>'status' = 'lost', 'four misses lose');
select t.check((current_setting('t.loss')::jsonb->>'score')::int = 0, 'a loss scores 0');
select t.check((current_setting('t.loss')::jsonb->>'stageIndex')::int = 3, 'a loss stays on the last stage');
select t.check(current_setting('t.loss')::jsonb->>'answerId' = current_setting('t.answer2'), 'a loss reveals the answer');
reset role;

-- ------------------------------------------------ the table cannot lie

select t.fails($$insert into public.rounds (player_id, track_id, score) values ('00000000-0000-0000-0000-000000000003', 'T1', 4)$$, 'non-DEFAULT');
select t.fails($$insert into public.rounds (player_id, track_id, stage_index) values ('00000000-0000-0000-0000-000000000001', 'T1', 7)$$, 'check');

-- ------------------------------------------------ filters and limits

set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000002');
select t.fails($$select public.start_round('{nobody}')$$, 'empty_pool');
select t.fails(format('select public.start_round(%L::text[])', '{' || repeat('x', 65) || '}'), 'invalid_filter');
reset role;

-- 60 rounds in the last hour for player 3: the 61st is refused.
insert into public.players (id) values ('00000000-0000-0000-0000-000000000003');
insert into public.rounds (player_id, track_id, status)
select '00000000-0000-0000-0000-000000000003', 'T1', 'lost' from generate_series(1, 60);
set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000003');
select t.fails('select public.start_round()', 'rate_limited');
reset role;

-- ------------------------------------------------ board, alias, mail

-- Player 1 has 1 unranked (artist a only) and 1 ranked finished round; 4 more
-- ranked rounds reach the minimum of 5, and the unranked one never counts.
set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000001');
do $$
declare r jsonb;
begin
  for i in 1..4 loop
    r := public.start_round();
    for j in 1..4 loop
      r := public.skip_round((r->>'id')::uuid, j - 1);
    end loop;
  end loop;
end $$;
select t.check((public.my_stats()->>'gamesPlayed')::int = 5, 'my_stats counts finished ranked rounds only');
select t.check((select count(*) from public.get_leaderboard()) = 0, 'no alias, not on the board');

select t.fails($$select public.set_alias('a')$$, 'invalid_alias');
select t.fails($$select public.set_alias('<script>')$$, 'invalid_alias');
select t.fails($$select public.set_alias('el_puto')$$, 'blocked_alias');
select t.fails($$select public.set_alias('GACETA oficial')$$, 'blocked_alias');
select t.fails($$select public.set_alias('el PÚTO')$$, 'blocked_alias');
select t.fails($$select public.set_alias('Pütá')$$, 'blocked_alias');
select t.check(public.set_alias('  computadora  ') = 'computadora', 'a word merely containing a blocked one is fine');
select t.check(public.set_alias('Tadu Vázquez') = 'Tadu Vázquez', 'accented letters are valid in any locale');
select t.check(public.set_alias('ñandú_22.b-c') = 'ñandú_22.b-c', 'ñ, digits and punctuation are valid');
select t.check(public.set_alias('Agus  ok') = 'Agus ok', 'spaces are trimmed and collapsed');
select t.check((select alias from public.get_leaderboard()) = 'Agus ok', 'with alias and 5 games, on the board');
select t.check((public.my_stats()->>'alias') = 'Agus ok', 'my_stats returns the alias');

select t.act_as('00000000-0000-0000-0000-000000000002');
select t.fails($$select public.set_alias('AGUS OK')$$, 'alias_taken');

select t.fails($$select public.subscribe_email('not-a-mail')$$, 'invalid_email');
select public.subscribe_email('  Fan@Example.com ');
select public.subscribe_email('otro@example.com');
reset role;
select t.check((select count(*) from public.emails where player_id = '00000000-0000-0000-0000-000000000002') = 1,
  'one address per player');
select t.check((select email from public.emails where player_id = '00000000-0000-0000-0000-000000000002') = 'fan@example.com',
  'addresses are stored normalised');

-- Player 2 has fewer than 5 rounds: not on the board even with an alias.
set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000002');
select public.set_alias('dos');
select t.check((select count(*) from public.get_leaderboard() where alias = 'dos') = 0, 'under 5 games, off the board');
reset role;

-- Old signatures are gone, so no client can reach the non-idempotent versions.
select t.check(to_regprocedure('public.guess_round(uuid,text)') is null
  and to_regprocedure('public.skip_round(uuid)') is null, 'old attempt signatures dropped');

-- A round whose track row disappeared still comes back as a round object.
insert into public.tracks (id, audio_key, artist_slugs, title) values ('GONE', 'kgone', '{z}', 'Gone');
insert into public.rounds (player_id, track_id) values ('00000000-0000-0000-0000-000000000003', 'GONE');
alter table public.rounds drop constraint rounds_track_id_fkey;
delete from public.tracks where id = 'GONE';
select t.check(
  (select private.round_view(r) from public.rounds r where r.track_id = 'GONE') ->> 'id' is not null,
  'the view survives a missing track');

-- Ranked needs "all" or 3+ artists that exist in the catalog.
set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000002');
select t.check((public.start_round('{a,b,c}')->>'ranked')::boolean, 'three real artists are ranked');
reset role;
update public.rounds set status = 'lost' where player_id = '00000000-0000-0000-0000-000000000002' and status = 'playing';
set role authenticated;
select t.check(not (public.start_round('{a,b,nobody}')->>'ranked')::boolean, 'an unknown artist does not count towards three');
reset role;

-- ------------------------------------------------ ranked only on first play

-- A track credited to three artist slugs that exist nowhere else: filtering
-- by exactly those three always deals this one track, so a repeat can be
-- forced deterministically instead of relying on start_round's random pick.
insert into public.tracks (id, audio_key, artist_slugs, title) values
  ('SOLO', 'ksolo', '{solo1,solo2,solo3}', 'Solito');
insert into auth.users (id) values ('00000000-0000-0000-0000-000000000004');

set role authenticated;
select t.act_as('00000000-0000-0000-0000-000000000004');
select set_config('t.r3', public.start_round('{solo1,solo2,solo3}')->>'id', false);
select t.check((public.start_round('{solo1,solo2,solo3}')->>'ranked')::boolean,
  'a three-real-artist selection is ranked on the first play');
select public.skip_round(current_setting('t.r3')::uuid, n) from generate_series(0, 2) n;
select public.skip_round(current_setting('t.r3')::uuid, 3);

-- Same filter, same only-matching track: the next round is a repeat.
select set_config('t.r4', public.start_round('{solo1,solo2,solo3}')->>'id', false);
reset role;

select t.check(current_setting('t.r4') <> current_setting('t.r3'), 'the repeat is dealt as a new round');
select t.check(not (select ranked from public.rounds where id = current_setting('t.r4')::uuid),
  'replaying the same track is not ranked, even though the selection alone would qualify');

set role authenticated;
select public.skip_round(current_setting('t.r4')::uuid, n) from generate_series(0, 2) n;
select public.skip_round(current_setting('t.r4')::uuid, 3);
select t.check((public.my_stats()->>'gamesPlayed')::int = 1,
  'the repeat is finished and scored, but excluded from my_stats');
reset role;

-- Simulate a row written before this rule existed, then fix it with the
-- backfill. Idempotent: running it twice changes nothing the second time.
update public.rounds set ranked = true where id = current_setting('t.r4')::uuid;
select t.check((select ranked from public.rounds where id = current_setting('t.r4')::uuid),
  'set back to true to simulate a pre-migration row');
select private.backfill_ranked_first_play();
select t.check(not (select ranked from public.rounds where id = current_setting('t.r4')::uuid),
  'the backfill flips a repeat back to unranked');
select private.backfill_ranked_first_play();
select t.check(not (select ranked from public.rounds where id = current_setting('t.r4')::uuid),
  'running the backfill again changes nothing (idempotent)');
select t.check((select ranked from public.rounds where id = current_setting('t.r3')::uuid),
  'the first play is untouched by the backfill');
