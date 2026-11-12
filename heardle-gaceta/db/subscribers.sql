-- Newsletter subscribers shared by every GACETA project that talks to the same
-- Neon database. `source` says which project collected the address (the heardle
-- writes 'heardle'). Valuto's `fans` table is separate; unifying the two is
-- later work and nothing here touches it, or any other table.
--
-- Safe to re-run. Apply by hand:
--   psql "$DATABASE_URL_UNPOOLED" -f db/subscribers.sql
-- gen_random_uuid() is built into Postgres 13+, so no extension is needed.

create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  source     text not null,
  created_at timestamptz not null default now(),
  constraint subscribers_email_length check (char_length(email) <= 254),
  constraint subscribers_email_shape  check (email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint subscribers_email_clean  check (email = lower(btrim(email))),
  constraint subscribers_source_shape check (source ~ '^[a-z0-9-]{1,32}$')
);

-- One row per address and project; a repeat is ignored by the writer.
create unique index if not exists subscribers_email_source_key
  on public.subscribers (email, source);
