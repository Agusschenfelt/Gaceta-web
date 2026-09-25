export function Tag({ active = false, className = "", ...props }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-xs tracking-wide transition-colors ${
        active ? "border-fg bg-fg text-bg" : "border-border text-muted hover:border-fg hover:text-fg"
      } ${className}`}
      {...props}
    />
  );
}
