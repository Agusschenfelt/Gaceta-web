import { describe, expect, it } from "vitest";
import { MAX_LUMINANCE, backgroundFor, dominantColor, luminance } from "./coverTint.js";

/** Builds RGBA pixels from [count, [r, g, b]] runs. */
function pixels(...runs) {
  const out = [];
  for (const [count, [r, g, b], a = 255] of runs) {
    for (let i = 0; i < count; i++) out.push(r, g, b, a);
  }
  return Uint8ClampedArray.from(out);
}

function parse(css) {
  return css.match(/\d+/g).map(Number);
}

describe("dominantColor", () => {
  it("returns the colour of a single-colour cover", () => {
    expect(dominantColor(pixels([10, [200, 30, 120]]))).toEqual({ r: 200, g: 30, b: 120 });
  });

  it("prefers the colour over black, white and grey areas", () => {
    const c = dominantColor(
      pixels([40, [0, 0, 0]], [30, [255, 255, 255]], [20, [128, 128, 128]], [10, [40, 60, 200]]),
    );
    expect(c).toEqual({ r: 40, g: 60, b: 200 });
  });

  it("picks the hue with the most saturated weight", () => {
    const c = dominantColor(pixels([30, [220, 40, 40]], [10, [40, 200, 60]]));
    expect(c).toEqual({ r: 220, g: 40, b: 40 });
  });

  it("returns null for a black and white cover", () => {
    expect(dominantColor(pixels([50, [0, 0, 0]], [50, [240, 240, 240]]))).toBeNull();
  });

  it("returns null when colour is only a speck", () => {
    expect(dominantColor(pixels([99, [20, 20, 20]], [1, [255, 0, 0]]))).toBeNull();
  });

  it("ignores transparent pixels and handles an empty image", () => {
    expect(dominantColor(pixels([10, [255, 0, 0], 0]))).toBeNull();
    expect(dominantColor(new Uint8ClampedArray())).toBeNull();
  });
});

describe("backgroundFor", () => {
  it("darkens bright colours until white text stays readable", () => {
    for (const color of [
      { r: 222, g: 229, b: 160 },
      { r: 30, g: 215, b: 96 },
      { r: 255, g: 255, b: 0 },
      { r: 200, g: 30, b: 120 },
    ]) {
      const [r, g, b] = parse(backgroundFor(color));
      expect(luminance(r, g, b)).toBeLessThanOrEqual(MAX_LUMINANCE);
      // Contrast of the body text (#ededed) against it.
      const contrast = (luminance(237, 237, 237) + 0.05) / (luminance(r, g, b) + 0.05);
      expect(contrast).toBeGreaterThan(8);
    }
  });

  it("keeps the hue when darkening", () => {
    const [r, g, b] = parse(backgroundFor({ r: 200, g: 30, b: 120 }));
    expect(r).toBeGreaterThan(b);
    expect(b).toBeGreaterThan(g);
  });

  it("leaves an already dark colour alone", () => {
    expect(backgroundFor({ r: 60, g: 10, b: 40 })).toBe("rgb(60 10 40)");
  });
});
