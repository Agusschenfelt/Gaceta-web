import { Icon } from "./Icon.jsx";

const TONES = {
  // Acid gold at rest; white floods in from the left on hover.
  accent: "bg-accent text-bg",
  // Outline at rest; the same white flood turns it solid and the text flips.
  outline: "border border-fg text-fg hover:text-bg focus-visible:text-bg",
};

/**
 * The reveal's big calls to action. Display type instead of button text, an
 * icon that moves on hover, and a fill that wipes across rather than fading,
 * so the invitation to act has the same energy as the record above it.
 *
 * Renders an `<a>` when given `href`, a `<button>` otherwise.
 */
export function ActionButton({ tone = "accent", icon, iconMotion = "", href, children, className = "", ...props }) {
  const Tag = href ? "a" : "button";
  const linkProps = href
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { type: "button" };
  return (
    <Tag
      {...linkProps}
      {...props}
      className={`group relative isolate inline-flex min-h-14 items-center justify-between gap-2 overflow-hidden rounded px-3.5 sm:gap-3 sm:px-4 transition-[color,transform] duration-300 active:scale-[0.98] ${TONES[tone]} ${className}`}
    >
      <span
        aria-hidden="true"
        className="absolute inset-0 -z-10 origin-left scale-x-0 bg-fg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
      />
      <span className="headline truncate text-lg !leading-none sm:text-xl">{children}</span>
      {icon && (
        <Icon
          name={icon}
          size={20}
          className={`shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${iconMotion}`}
        />
      )}
    </Tag>
  );
}
