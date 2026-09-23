// End-to-end smoke test against the real Supabase project: access lockdown, anonymous
// sign-in, dealing, resume, isolation between players, answer/audio consistency, alias.
// Usage (from heardle-gaceta/, .env with VITE_SUPABASE_* and AUDIO_KEY_SECRET, after npm run assets):
//   set -a; . ./.env; set +a; node supabase/tests/smoke.mjs
// It leaves two anonymous users behind; remove them afterwards in the SQL editor:
//   delete from auth.users where is_anonymous and id in (<the two ids it prints>);
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync, readFileSync } from "node:fs";
const req = createRequire(process.cwd() + "/package.json");
const { createClient } = await import(pathToFileURL(req.resolve("@supabase/supabase-js")).href);
const { audioKey } = await import(pathToFileURL(process.cwd() + "/scripts/lib/publish.mjs").href);
const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY;
const opts = { auth: { persistSession: false, autoRefreshToken: false } };
let failures = 0;
const check = (ok, what) => { console.log(`${ok ? "ok  " : "FAIL"} ${what}`); if (!ok) failures++; };

const anon = createClient(url, key, opts);
for (const t of ["tracks", "rounds", "players", "emails"]) {
  const { data, error } = await anon.from(t).select("*").limit(1);
  check(error || (data ?? []).length === 0, `anon cannot read ${t} (${error?.code ?? "empty"})`);
}
{ const { error } = await anon.from("rounds").insert({ player_id: "00000000-0000-0000-0000-000000000000", track_id: "x" });
  check(!!error, `anon cannot insert rounds (${error?.code})`); }
{ const { error } = await anon.rpc("get_leaderboard", { p_limit: 5 }); check(!error, "anon can read the board"); }
{ const { error } = await anon.rpc("start_round", { p_artists: [] }); check(!!error, `no session, no round (${error?.code})`); }

const a = createClient(url, key, opts);
const { data: s1, error: e1 } = await a.auth.signInAnonymously();
check(!e1 && s1.user?.is_anonymous, "anonymous sign-in works");
const { data: r1, error: re1 } = await a.rpc("start_round", { p_artists: ["ramma"] });
check(!re1 && r1?.audioKey && r1.answerId === null, `round dealt, answer hidden (${re1?.message ?? "ok"})`);
check(existsSync(`public/audio/${r1?.audioKey}.mp3`), "its audio file is published under the opaque key");
const { data: again } = await a.rpc("start_round", { p_artists: ["ara"] });
check(again?.id === r1?.id, "an open round is resumed, not rerolled");
{ const { data: t } = await a.from("rounds").select("track_id").eq("id", r1.id);
  check(!t || t.length === 0, "the player cannot read their own round's answer from the table"); }

const b = createClient(url, key, opts);
await b.auth.signInAnonymously();
{ const { error } = await b.rpc("skip_round", { p_round: r1.id }); check(error?.message?.includes("round_not_found"), "another player cannot touch the round"); }

let view = r1;
for (let i = 0; i < 4; i++) view = (await a.rpc("skip_round", { p_round: r1.id })).data;
check(view?.status === "lost" && view.score === 0 && view.answerId, "four skips lose and reveal the answer");
check(audioKey(view.answerId, process.env.AUDIO_KEY_SECRET) === r1.audioKey, "the revealed answer matches the audio that played");
const catalog = JSON.parse(readFileSync("public/catalog/ramma.json", "utf8"));
check(catalog.tracks.some((t) => t.id === view.answerId), "the answer came from the chosen artist");
check(!JSON.stringify(catalog).includes(r1.audioKey), "the public catalog does not contain the audio key");

{ const { error } = await a.rpc("set_alias", { p_alias: "el puto" }); check(error?.message?.includes("blocked_alias"), "blocked alias refused"); }
{ const { data, error } = await a.rpc("set_alias", { p_alias: "smoke test" }); check(!error && data === "smoke test", "valid alias saved"); }
{ const { data } = await a.rpc("my_stats"); check(data?.gamesPlayed === 1 && data.alias === "smoke test", "my_stats reflects the round"); }

console.log(`ids ${s1.user.id} ${(await b.auth.getUser()).data.user.id}`);
process.exit(failures ? 1 : 0);
