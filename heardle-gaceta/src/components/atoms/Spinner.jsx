export function Spinner({ label = "Cargando" }) {
  return (
    <span role="status" aria-label={label} className="inline-flex items-center gap-2 text-muted">
      <span className="h-3 w-3 animate-spin rounded-full border border-border border-t-fg" />
      <span className="label">{label}</span>
    </span>
  );
}
