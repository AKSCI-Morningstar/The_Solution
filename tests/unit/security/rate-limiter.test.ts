import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRateLimiter,
  loginRateLimiter,
  registrationRateLimiter,
} from "@/server/security/rate-limiter";

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 3;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createRateLimiter", () => {
  it("allows attempts under the threshold", () => {
    const limiter = createRateLimiter({
      namespace: "test-a",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    const key = "under-threshold";
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) limiter.record(key);
    expect(limiter.check(key)).toBeNull();
  });

  it("blocks once the attempt count reaches the threshold", () => {
    const limiter = createRateLimiter({
      namespace: "test-b",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    const key = "at-threshold";
    for (let i = 0; i < MAX_ATTEMPTS; i++) limiter.record(key);
    expect(limiter.check(key)).not.toBeNull();
  });

  it("reports a positive retry-after while blocked", () => {
    const limiter = createRateLimiter({
      namespace: "test-c",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    const key = "retry-after";
    for (let i = 0; i < MAX_ATTEMPTS; i++) limiter.record(key);
    const retryAfter = limiter.check(key);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });

  it("resets after the window elapses", () => {
    const limiter = createRateLimiter({
      namespace: "test-d",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    const key = "window-reset";
    for (let i = 0; i < MAX_ATTEMPTS; i++) limiter.record(key);
    expect(limiter.check(key)).not.toBeNull();

    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1));
    expect(limiter.check(key)).toBeNull();
  });

  it("keeps separate counters for separate keys", () => {
    const limiter = createRateLimiter({
      namespace: "test-e",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    for (let i = 0; i < MAX_ATTEMPTS; i++) limiter.record("key-a");
    expect(limiter.check("key-a")).not.toBeNull();
    expect(limiter.check("key-b")).toBeNull();
  });

  it("clear immediately unblocks a key", () => {
    const limiter = createRateLimiter({
      namespace: "test-f",
      windowMs: WINDOW_MS,
      maxAttempts: MAX_ATTEMPTS,
    });
    const key = "clear-me";
    for (let i = 0; i < MAX_ATTEMPTS; i++) limiter.record(key);
    expect(limiter.check(key)).not.toBeNull();

    limiter.clear(key);
    expect(limiter.check(key)).toBeNull();
  });

  it("different limiter instances never share counters, even for the same key", () => {
    const key = "shared-key-value";
    for (let i = 0; i < 20; i++) loginRateLimiter.record(key);
    // registrationRateLimiter has never recorded anything for this key - its own namespace keeps it isolated.
    expect(registrationRateLimiter.check(key)).toBeNull();
    loginRateLimiter.clear(key);
  });
});
