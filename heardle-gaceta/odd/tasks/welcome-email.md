# Welcome email

## Objective
Send a welcome email ("gracias por sumarte a GACETA") to every new address saved from the reveal, without adding friction: no confirmation click, no double opt-in.

## Problem / why
The reveal only stores the address. The user wants people who sign up to get something back, but explicitly rejected double opt-in (2026-09-29): these are GACETA's first emails and every extra step loses people.

## Scope
- Database trigger on insert into `public.emails` that asks an Edge Function to send the welcome. Only real inserts fire it (a repeat is `on conflict do nothing`, so no second mail).
- Supabase Edge Function `welcome-email` that sends through Resend.
- Sender `GACETA <hola@esgaceta.com>` (domain verified in Resend; DNS in Vercel, loaded by the user). Reply-to `contacto@gacetaplay.com`.
- No client change.

## Constraints
- The welcome never blocks or fails the subscription: any error in the trigger is swallowed; pg_net is async.
- `schema.sql` must keep running on the disposable Postgres of `supabase/tests/run.sh`, which has no pg_net and no Vault: the trigger does nothing when either is missing or unconfigured.
- Only the trigger can make the function send: shared secret header (`WELCOME_HOOK_SECRET` in function secrets, same value in Vault). The function is deployed with `--no-verify-jwt` and rejects anything without the secret.
- Secrets never in git: `RESEND_API_KEY` (already set by the user), `WELCOME_HOOK_SECRET`, Vault entries.
- Copy in neutral Spanish with soft voseo; code, identifiers and comments in English.
- No new npm dependencies.

## Tasks
- [ ] T1 Edge Function `supabase/functions/welcome-email/` + pure message builder with vitest tests.
- [ ] T2 Trigger in `supabase/schema.sql` (Vault + pg_net, no-op when missing) + SQL test in `secure_rounds.test.sql`.
- [ ] T3 Rollout: pg_net, Vault secrets, function secrets, schema applied, function deployed; test send to `delivered@resend.dev`.
- [ ] T4 Docs in CLAUDE.md.

## Acceptance criteria
- A new subscription produces exactly one welcome email; a repeated address produces none.
- Subscription succeeds even if the function, Resend or pg_net fails.
- `npm run test`, `npm run build`, lint and `supabase/tests/run.sh` pass.

## Checks
- TDD: not configured for this project (ordinary functional checks). Runner: vitest (`npm run test`), SQL: `supabase/tests/run.sh`.

## Progress
- 2026-09-29: document created; 0 addresses stored in production, so no backfill needed.
