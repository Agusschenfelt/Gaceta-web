/**
 * Authored icon set. One stroke weight, one grid, `currentColor` throughout, so
 * an icon inherits whatever the surrounding text colour is.
 *
 * The play affordance is not here: it is the GACETA isotype, painted as a CSS
 * mask in PlayCircle.
 */

const PATHS = {
  check: <path d="M4 12.5 9 17.5 20 6.5" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  skip: <path d="M5 12h14" />,
  chevronDown: <path d="M6 9.5 12 15.5 18 9.5" />,
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" />
      <path d="M12 14v3M9 20h6M10 17h4" />
    </>
  ),
  settings: <path d="M4 7h16M4 12h16M4 17h16" />,
};

export function Icon({ name, size = 16, className = "", ...props }) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      {path}
    </svg>
  );
}
