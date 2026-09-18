import { useState } from "react";
import { Button } from "../atoms/Button.jsx";
import { TextInput } from "../atoms/TextInput.jsx";
import { Icon } from "../atoms/Icon.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function EmailCapture({ onSubmit, onDismiss }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState("idle"); // idle | saving | done | error

  async function submit(e) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) return;
    setState("saving");
    try {
      await onSubmit(email.trim());
      setState("done");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return <p className="fade-up text-sm text-muted">Listo. Te avisamos cuando haya novedades.</p>;
  }

  return (
    <form onSubmit={submit} className="fade-up flex flex-col gap-2" aria-label="Novedades por mail">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor="email" className="text-sm text-muted">
          Dejá tu mail para novedades de GACETA
        </label>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Cerrar"
          className="-m-2 p-2 text-muted transition-colors hover:text-fg"
        >
          <Icon name="close" size={14} />
        </button>
      </div>
      <div className="flex gap-2">
        <TextInput
          id="email"
          type="email"
          inputMode="email"
          placeholder="tu@mail.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" variant="primary" disabled={!EMAIL_RE.test(email) || state === "saving"}>
          Sumarme
        </Button>
      </div>
      {state === "error" && <p className="text-xs text-danger">No se pudo guardar. Probá de nuevo.</p>}
    </form>
  );
}
