const TEXT_FIELDS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

function isTextField(target) {
  return Boolean(target && (target.isContentEditable || TEXT_FIELDS.has(target.tagName)));
}

/**
 * Maps a keydown to a game shortcut: "search" (Tab focuses the guess box) or
 * "play" (Space plays the clip). Returns null to leave the key alone.
 *
 * While typing in a field both keys keep their native meaning: Space types a
 * space and Tab moves on, so the search is never a focus trap. Shift+Tab stays
 * native everywhere so every control is still reachable backwards.
 */
export function shortcutFor(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || isTextField(e.target)) return null;
  if (e.key === "Tab" && !e.shiftKey) return "search";
  if (e.key === " " && !e.repeat) return "play";
  return null;
}
