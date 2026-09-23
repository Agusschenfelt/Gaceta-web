import { useState } from "react";
import { Button } from "../atoms/Button.jsx";
import { TextInput } from "../atoms/TextInput.jsx";
import { Spinner } from "../atoms/Spinner.jsx";
import { Icon } from "../atoms/Icon.jsx";
import { EmailCapture } from "./EmailCapture.jsx";
import { ALIAS_MAX, ALIAS_MIN, isValidAlias } from "../../player/playerIdentity.js";
import { MIN_GAMES, gamesMissing } from "../../leaderboard/ranking.js";

function formatAvg(n) {
  return n.toFixed(1);
}

function Row({ rank, alias, gamesPlayed, avgScore, mine }) {
  return (
    <>
      <span className="w-5 shrink-0 tabular-nums text-muted">{rank}</span>
      <span className={`flex-1 truncate ${mine ? "text-accent" : ""}`}>{alias}</span>
      <span className="w-16 shrink-0 text-right tabular-nums text-muted">{gamesPlayed}</span>
      <span className="w-12 shrink-0 text-right font-semibold tabular-nums">
        {formatAvg(avgScore)}
      </span>
    </>
  );
}

/**
 * A view of its own, reached from the result. It is capped at TOP_ROWS instead
 * of scrolling, and asks for one thing at a time: an alias first, because
 * without it you are not on the board, and only then the mail.
 */
const TOP_ROWS = 10;

export function Leaderboard({
  rows,
  me = null,
  loading,
  error,
  alias,
  onSetAlias,
  onClose,
  emailPrompt,
  onSubmitEmail,
  onDismissEmail,
}) {
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!isValidAlias(draft)) return;
    setSaving(true);
    try {
      await onSetAlias(draft.trim());
    } finally {
      setSaving(false);
    }
  }

  const top = rows.slice(0, TOP_ROWS);
  const myRow = rows.findIndex((r) => r.alias === alias);
  const belowCut = myRow >= TOP_ROWS;
  // Qualified but past the rows we fetched: show their numbers without a rank.
  const missing = me ? gamesMissing(me.gamesPlayed) : 0;
  const offBoard = alias && me && missing === 0 && myRow === -1;

  return (
    <section className="fade-up mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col gap-3 overflow-hidden" aria-label="Ranking">
      <div className="flex shrink-0 items-baseline justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="headline text-xl !leading-snug">
            Ranking <em>global</em>
          </h2>
          <span className="label">Promedio · mín. {MIN_GAMES} partidas</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="label flex items-center gap-1.5 transition-colors hover:text-fg"
        >
          <Icon name="close" size={13} />
          Cerrar
        </button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start overflow-hidden">
        {loading && <Spinner label="Cargando ranking" />}
        {error && <p className="text-sm text-danger">No pudimos cargar el ranking.</p>}
        {!loading && !error && top.length === 0 && (
          <p className="text-sm text-muted">Todavía no hay nadie. Sé el primero.</p>
        )}
        {top.length > 0 && (
          <ol className="flex flex-col divide-y divide-border">
            <li className="label flex items-center gap-3 pb-1.5" aria-hidden="true">
              <span className="w-5 shrink-0" />
              <span className="flex-1" />
              <span className="w-16 shrink-0 text-right">Partidas</span>
              <span className="w-12 shrink-0 text-right">Prom</span>
            </li>
            {top.map((r, i) => (
              <li key={r.alias} className="flex items-center gap-3 py-1.5 text-sm">
                <Row rank={i + 1} {...r} mine={r.alias === alias} />
              </li>
            ))}
          </ol>
        )}
        {belowCut && (
          <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-sm">
            <Row rank={myRow + 1} {...rows[myRow]} mine />
          </div>
        )}
        {offBoard && (
          <div className="mt-2 flex items-center gap-3 border-t border-border pt-2 text-sm">
            <Row rank="—" alias={alias} gamesPlayed={me.gamesPlayed} avgScore={me.avgScore} mine />
          </div>
        )}
        {!loading && !error && missing > 0 && (
          <p className="mt-3 text-sm text-muted">
            {missing === 1 ? "Te falta 1 partida" : `Te faltan ${missing} partidas`} para entrar al
            ranking.
          </p>
        )}
      </div>

      {!alias ? (
        <form onSubmit={submit} className="flex shrink-0 flex-col gap-2" aria-label="Elegí tu alias">
          <label htmlFor="alias" className="text-sm text-muted">
            Poné un alias para aparecer acá
          </label>
          <div className="flex gap-2">
            <TextInput
              id="alias"
              value={draft}
              minLength={ALIAS_MIN}
              maxLength={ALIAS_MAX}
              placeholder="Tu alias"
              onChange={(e) => setDraft(e.target.value)}
            />
            <Button type="submit" variant="primary" disabled={!isValidAlias(draft) || saving}>
              Listo
            </Button>
          </div>
        </form>
      ) : emailPrompt === "pending" ? (
        <div className="shrink-0">
          <EmailCapture onSubmit={onSubmitEmail} onDismiss={onDismissEmail} />
        </div>
      ) : (
        <span className="label shrink-0">Jugás como {alias}</span>
      )}
    </section>
  );
}
