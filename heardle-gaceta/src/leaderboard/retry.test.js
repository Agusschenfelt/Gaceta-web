import { describe, it, expect, vi } from "vitest";
import { withRetry } from "./retry.js";

const noSleep = () => Promise.resolve();

describe("withRetry", () => {
  it("returns the first success without retrying", async () => {
    const fn = vi.fn(async () => "ok");
    expect(await withRetry(fn, { sleep: noSleep })).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries until it succeeds", async () => {
    let calls = 0;
    const fn = async () => {
      calls++;
      if (calls < 3) throw new Error("boom");
      return "ok";
    };
    expect(await withRetry(fn, { sleep: noSleep })).toBe("ok");
    expect(calls).toBe(3);
  });

  it("rethrows the last error once attempts run out", async () => {
    const fn = vi.fn(async () => {
      throw new Error("último");
    });
    await expect(withRetry(fn, { attempts: 3, sleep: noSleep })).rejects.toThrow("último");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("backs off exponentially", async () => {
    const waits = [];
    const fn = async () => {
      throw new Error("boom");
    };
    await expect(
      withRetry(fn, { attempts: 4, baseDelay: 100, sleep: (ms) => (waits.push(ms), Promise.resolve()) }),
    ).rejects.toThrow();
    expect(waits).toEqual([100, 200, 400]); // no sleep after the final attempt
  });

  it("honours a single-attempt configuration", async () => {
    const fn = vi.fn(async () => {
      throw new Error("boom");
    });
    await expect(withRetry(fn, { attempts: 1, sleep: noSleep })).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe("withRetry shouldRetry", () => {
  it("stops at once on an error that will not change on retry", async () => {
    let calls = 0;
    const refusal = new Error("rate_limited");
    await expect(
      withRetry(
        async () => {
          calls += 1;
          throw refusal;
        },
        { sleep: async () => {}, shouldRetry: () => false }
      )
    ).rejects.toBe(refusal);
    expect(calls).toBe(1);
  });
});
