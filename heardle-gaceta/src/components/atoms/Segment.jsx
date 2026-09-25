const STATE_CLASS = {
  unused: "bg-surface",
  current: "bg-fg",
  wrong: "bg-danger",
  skip: "bg-muted",
  correct: "bg-accent",
};

/** One cell of the stage progress bar. */
export function Segment({ state = "unused" }) {
  return <span aria-hidden="true" className={`h-1 flex-1 rounded-sm ${STATE_CLASS[state]}`} />;
}
