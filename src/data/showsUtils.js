// Local calendar date as "YYYY-MM-DD". Comparing strings avoids the UTC shift of
// `new Date("YYYY-MM-DD")`, which in Argentina marks a show as past from 21:00
// of the day before.
export function todayISO(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// A show without a date is a "mystery" announcement and always counts as upcoming.
export function isUpcoming(show, today = todayISO()) {
  return !show.date || show.date >= today;
}

// Upcoming first by date ascending; mystery shows last.
export function compareUpcoming(a, b) {
  if (!a.date && b.date) return 1;
  if (a.date && !b.date) return -1;
  if (!a.date && !b.date) return 0;
  return a.date.localeCompare(b.date);
}
