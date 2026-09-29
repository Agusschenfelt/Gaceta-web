import { useEffect } from "react";
import { backgroundFor, dominantColor } from "./coverTint.js";

/* The cover is read at this size: plenty to find a dominant hue, and cheap. */
const SAMPLE = 32;

/**
 * While mounted, tints the page with the cover's dominant colour by overriding
 * `--color-bg` on <html> (index.css transitions it) and hides the grain with
 * `data-tinted`. Unmounting, or a cover that cannot be read, leaves the default
 * background and its grain in place.
 *
 * The cover loads in its own `crossOrigin` image so the canvas can read it;
 * the visible <img> stays a plain one, so a CDN that ever drops its CORS header
 * costs the tint, never the cover.
 */
export function useCoverTint(url) {
  useEffect(() => {
    if (!url) return undefined;
    const root = document.documentElement;
    const meta = document.querySelector('meta[name="theme-color"]');
    const defaultThemeColor = meta?.getAttribute("content");
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE;
        canvas.height = SAMPLE;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, SAMPLE, SAMPLE);
        const color = dominantColor(ctx.getImageData(0, 0, SAMPLE, SAMPLE).data);
        if (!color) return;
        const bg = backgroundFor(color);
        root.style.setProperty("--color-bg", bg);
        // The grain reads as a dirty filter over a coloured background.
        root.dataset.tinted = "";
        meta?.setAttribute("content", bg);
      } catch {
        /* tainted canvas or no 2D context: keep the default background */
      }
    };
    img.src = url;

    return () => {
      cancelled = true;
      img.onload = null;
      root.style.removeProperty("--color-bg");
      delete root.dataset.tinted;
      if (meta && defaultThemeColor) meta.setAttribute("content", defaultThemeColor);
    };
  }, [url]);
}
