export function IconButton({ label, className = "", children, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded border border-border text-muted transition-colors hover:border-fg hover:text-fg ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
