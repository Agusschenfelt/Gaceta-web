import { afterEach, describe, it, expect, vi } from "vitest";
import { withRetry, withTimeout } from "./retry.js";
import { toRoundError } from "../rounds/roundErrors.js";

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

describe("withTimeout", () => {
  afterEach(() => vi.useRealTimers());

  it("resolves with the value when the promise settles in time", async () => {
    expect(await withTimeout(Promise.resolve("ok"), 1000)).toBe("ok");
  });

  it("passes through the promise's own rejection", async () => {
    const refusal = new Error("rate_limited");
    await expect(withTimeout(Promise.reject(refusal), 1000)).rejects.toBe(refusal);
  });

  it("rejects a hung request as a connection error, so withRetry retries it", async () => {
    vi.useFakeTimers();
    const hung = withTimeout(new Promise(() => {}), 10_000);
    const settled = hung.catch((e) => e);
    await vi.advanceTimersByTimeAsync(10_000);
    const error = await settled;
    expect(error.message).toMatch(/timed out/);
    expect(toRoundError(error).code).toBe("network");
  });

  it("retries a request that hangs once and then answers", async () => {
    vi.useFakeTimers();
    let calls = 0;
    const run = () => {
      calls++;
      return calls === 1 ? new Promise(() => {}) : Promise.resolve("round");
    };
    const result = withRetry(() => withTimeout(run(), 5000), {
      shouldRetry: (e) => toRoundError(e).code === "network",
      sleep: () => Promise.resolve(),
    });
    await vi.advanceTimersByTimeAsync(5000);
    expect(await result).toBe("round");
    expect(calls).toBe(2);
  });
});
