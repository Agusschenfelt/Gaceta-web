const VARIANTS = {
  primary: "bg-fg text-bg hover:opacity-90",
  secondary: "border border-border text-fg hover:border-fg",
  ghost: "text-muted hover:text-fg",
  accent: "bg-accent text-bg hover:opacity-90",
};

export function Button({ variant = "secondary", className = "", type = "button", ...props }) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded px-4 py-2.5 text-sm font-medium tracking-tight transition-[opacity,border-color,color] disabled:cursor-not-allowed disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
