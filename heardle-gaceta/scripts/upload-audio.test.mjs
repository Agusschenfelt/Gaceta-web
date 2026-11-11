import { describe, it, expect, vi } from "vitest";
import { runUpload, listRemote } from "./upload-audio.mjs";

const DIR = "/pub";
const SIZES = { "/pub/audio/a.mp3": 10, "/pub/audio/b.mp3": 20, "/pub/peaks.json": 5 };

function setup({ remote = [], pages, ...opts } = {}) {
  const puts = [];
  const dels = [];
  const logs = [];
  const client = {
    list: vi.fn(async ({ cursor }) => {
      if (pages) return pages[cursor ?? 0];
      return { blobs: remote, hasMore: false };
    }),
    put: vi.fn(async (p, _b, o) => void puts.push([p, o])),
    del: vi.fn(async (p) => void dels.push(p)),
  };
  const fsx = {
    readdir: async () => ["a.mp3", "b.mp3", "notes.txt"],
    readFile: async (f) => Buffer.from(f),
    stat: async (f) => ({ size: SIZES[f] }),
  };
  const run = () => runUpload({ client, fsx, publishedDir: DIR, log: (m) => logs.push(m), ...opts });
  return { client, puts, dels, logs, run };
}

const blob = (name, size) => ({ pathname: `audio/${name}`, size });

describe("listRemote", () => {
  it("follows the cursor across pages and ignores foreign prefixes", async () => {
    const { client } = setup({
      pages: {
        0: { blobs: [blob("a.mp3", 1), { pathname: "other/x", size: 9 }], hasMore: true, cursor: "c1" },
        c1: { blobs: [blob("b.mp3", 2)], hasMore: false },
      },
    });
    const m = await listRemote(client);
    expect([...m]).toEqual([["a.mp3", 1], ["b.mp3", 2]]);
    expect(client.list).toHaveBeenCalledTimes(2);
    expect(client.list.mock.calls[1][0].cursor).toBe("c1");
  });
});

describe("runUpload", () => {
  it("uploads missing or resized files and skips same-size ones", async () => {
    const { run, puts } = setup({ remote: [blob("a.mp3", 10), blob("b.mp3", 99)] });
    await run();
    expect(puts.map(([p]) => p)).toEqual(["audio/b.mp3", "audio/peaks.json"]);
    expect(puts[0][1]).toMatchObject({ cacheControlMaxAge: 86400, contentType: "audio/mpeg", allowOverwrite: true });
    expect(puts[1][1]).toMatchObject({ cacheControlMaxAge: 300, contentType: "application/json" });
  });

  it("uploads everything with force", async () => {
    const { run, puts } = setup({ remote: [blob("a.mp3", 10), blob("b.mp3", 20)], force: true });
    await run();
    expect(puts.map(([p]) => p)).toEqual(["audio/a.mp3", "audio/b.mp3", "audio/peaks.json"]);
  });

  it("holds peaks.json back while stale keys exist and nothing is pruned", async () => {
    const { run, puts, dels, logs } = setup({ remote: [blob("old.mp3", 1)] });
    await run();
    expect(puts.map(([p]) => p)).toEqual(["audio/a.mp3", "audio/b.mp3"]);
    expect(dels).toEqual([]);
    expect(logs.join("\n")).toMatch(/skipping peaks\.json/);
  });

  it("a stray non-mp3 object never holds peaks.json back", async () => {
    const { run, puts, dels } = setup({ remote: [blob("notes.txt", 1)] });
    await run();
    expect(puts.map(([p]) => p)).toContain("audio/peaks.json");
    expect(dels).toEqual([]);
  });

  it("prune uploads peaks.json and deletes only stale audio/*.mp3", async () => {
    const { run, puts, dels } = setup({
      remote: [blob("a.mp3", 10), blob("b.mp3", 20), blob("old.mp3", 1), blob("peaks.json", 5), blob("readme.txt", 1)],
      prune: true,
    });
    await run();
    expect(puts.map(([p]) => p)).toEqual(["audio/peaks.json"]);
    expect(dels).toEqual([["audio/old.mp3"]]);
  });

  it("does not write or delete on a dry run", async () => {
    const { run, client } = setup({ remote: [blob("old.mp3", 1)], prune: true, dry: true });
    await run();
    expect(client.put).not.toHaveBeenCalled();
    expect(client.del).not.toHaveBeenCalled();
  });

  it("deletes in batches of 100", async () => {
    const remote = Array.from({ length: 150 }, (_, i) => blob(`s${i}.mp3`, 1));
    const { run, dels } = setup({ remote, prune: true });
    await run();
    expect(dels.map((d) => d.length)).toEqual([100, 50]);
  });
});
