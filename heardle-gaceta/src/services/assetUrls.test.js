import { describe, it, expect, vi } from "vitest";
import { resolveAssetUrls } from "./assetUrls.js";

describe("resolveAssetUrls", () => {
  it("uses local paths without any config", () => {
    const u = resolveAssetUrls({});
    expect(u.audioUrl("k")).toBe("/audio/k.mp3");
    expect(u.peaksUrl).toBe("/catalog/peaks.json");
  });

  it("keeps the Supabase bucket until it is removed", () => {
    const u = resolveAssetUrls({ VITE_SUPABASE_URL: "https://x.supabase.co" });
    expect(u.audioUrl("k")).toBe("https://x.supabase.co/storage/v1/object/public/audio/k.mp3");
    expect(u.peaksUrl).toBe("https://x.supabase.co/storage/v1/object/public/audio/peaks.json");
  });

  it("uses the Blob base in API mode and tolerates trailing slashes", () => {
    for (const base of ["https://s.public.blob.vercel-storage.com/audio", "https://s.public.blob.vercel-storage.com/audio//"]) {
      const u = resolveAssetUrls({ VITE_ROUNDS_API: "true", VITE_AUDIO_BASE_URL: base });
      expect(u.audioUrl("a-b_c")).toBe("https://s.public.blob.vercel-storage.com/audio/a-b_c.mp3");
      expect(u.peaksUrl).toBe("https://s.public.blob.vercel-storage.com/audio/peaks.json");
    }
  });

  it("API mode wins over Supabase", () => {
    const u = resolveAssetUrls({
      VITE_ROUNDS_API: "true",
      VITE_AUDIO_BASE_URL: "https://b/audio",
      VITE_SUPABASE_URL: "https://x.supabase.co",
    });
    expect(u.audioUrl("k")).toBe("https://b/audio/k.mp3");
  });

  it("warns and falls back to local paths when the Blob base is missing", () => {
    const warn = vi.fn();
    const u = resolveAssetUrls({ VITE_ROUNDS_API: "true", VITE_AUDIO_BASE_URL: " " }, warn);
    expect(warn).toHaveBeenCalledOnce();
    expect(u.audioUrl("k")).toBe("/audio/k.mp3");
  });
});
