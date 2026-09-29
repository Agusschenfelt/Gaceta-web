/**
 * The reveal's background takes the colour of the answer's cover. Pure: it
 * works on raw RGBA pixels, so the canvas that reads them stays in the hook
 * (useCoverTint.js) and this part is testable in node.
 */

/* Hue buckets. Fine enough to keep a magenta apart from a red, coarse enough
   that one colour of a cover lands in one bucket. */
const HUE_BUCKETS = 12;
/* Pixels this grey, dark or washed out say nothing about the cover's colour. */
const MIN_SATURATION = 0.2;
const MIN_LIGHTNESS = 0.12;
const MAX_LIGHTNESS = 0.9;
/* A dominant hue needs at least this share of the cover's weight; below it
   the cover is effectively grey and the background stays the default. */
const MIN_SHARE = 0.04;
/* Ceiling on the background's relative luminance. At 0.05 the body text
   (#ededed) keeps a contrast near 9:1 and the muted text stays above 4.5:1. */
export const MAX_LUMINANCE = 0.05;

/**
 * Picks the cover's dominant colour: the hue that carries the most saturated
 * pixels, averaged. Returns `{ r, g, b }` (0-255) or `null` for a cover with
 * no real colour (black and white, or nearly so).
 */
export function dominantColor(pixels) {
  const buckets = Array.from({ length: HUE_BUCKETS }, () => ({ weight: 0, r: 0, g: 0, b: 0 }));
  let total = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if (pixels[i + 3] < 128) continue;
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    total += 1;
    const { h, s, l } = toHsl(r, g, b);
    if (s < MIN_SATURATION || l < MIN_LIGHTNESS || l > MAX_LIGHTNESS) continue;
    const bucket = buckets[Math.floor((h / 360) * HUE_BUCKETS) % HUE_BUCKETS];
    // Saturation weighs in so a vivid patch beats a larger dull one.
    bucket.weight += s;
    bucket.r += r * s;
    bucket.g += g * s;
    bucket.b += b * s;
  }
  const best = buckets.reduce((a, c) => (c.weight > a.weight ? c : a));
  if (total === 0 || best.weight < total * MIN_SHARE) return null;
  return {
    r: Math.round(best.r / best.weight),
    g: Math.round(best.g / best.weight),
    b: Math.round(best.b / best.weight),
  };
}

/**
 * Darkens a colour, keeping its hue, until its relative luminance is at most
 * MAX_LUMINANCE, so white text stays readable on it. Returns `rgb(r g b)`.
 */
export function backgroundFor({ r, g, b }) {
  let k = 1;
  if (luminance(r, g, b) > MAX_LUMINANCE) {
    let lo = 0, hi = 1;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (luminance(r * mid, g * mid, b * mid) > MAX_LUMINANCE) hi = mid;
      else lo = mid;
    }
    k = lo;
  }
  // Floor, not round: rounding up could push it back over the ceiling.
  return `rgb(${Math.floor(r * k)} ${Math.floor(g * k)} ${Math.floor(b * k)})`;
}

/** WCAG relative luminance of an sRGB colour (0-255 channels). */
export function luminance(r, g, b) {
  const lin = (c) => {
    const v = c / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function toHsl(r, g, b) {
  const R = r / 255, G = g / 255, B = b / 255;
  const max = Math.max(R, G, B), min = Math.min(R, G, B);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === R) h = 60 * (((G - B) / d) % 6);
  else if (max === G) h = 60 * ((B - R) / d + 2);
  else h = 60 * ((R - G) / d + 4);
  return { h: (h + 360) % 360, s, l };
}
