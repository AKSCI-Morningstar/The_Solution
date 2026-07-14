import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkLoginRateLimit,
  clearLoginAttempts,
  recordFailedLoginAttempt,
} from "@/server/auth/rate-limiter";

const MAX_ATTEMPTS = 10;
const WINDOW_MS = 15 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("checkLoginRateLimit / recordFailedLoginAttempt", () => {
  it("allows attempts under the threshold", () => {
    const key = "test:under-threshold";
    for (let i = 0; i < MAX_ATTEMPTS - 1; i++) recordFailedLoginAttempt(key);
    expect(checkLoginRateLimit(key)).toBeNull();
  });

  it("blocks once the attempt count reaches the threshold", () => {
    const key = "test:at-threshold";
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedLoginAttempt(key);
    expect(checkLoginRateLimit(key)).not.toBeNull();
  });

  it("reports a positive retry-after while blocked", () => {
    const key = "test:retry-after";
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedLoginAttempt(key);
    const retryAfter = checkLoginRateLimit(key);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(WINDOW_MS / 1000);
  });

  it("resets after the window elapses", () => {
    const key = "test:window-reset";
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedLoginAttempt(key);
    expect(checkLoginRateLimit(key)).not.toBeNull();

    vi.setSystemTime(new Date(Date.now() + WINDOW_MS + 1));
    expect(checkLoginRateLimit(key)).toBeNull();
  });

  it("keeps separate counters for separate keys", () => {
    const keyA = "test:key-a";
    const keyB = "test:key-b";
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedLoginAttempt(keyA);
    expect(checkLoginRateLimit(keyA)).not.toBeNull();
    expect(checkLoginRateLimit(keyB)).toBeNull();
  });
});

describe("clearLoginAttempts", () => {
  it("immediately unblocks a key", () => {
    const key = "test:clear";
    for (let i = 0; i < MAX_ATTEMPTS; i++) recordFailedLoginAttempt(key);
    expect(checkLoginRateLimit(key)).not.toBeNull();

    clearLoginAttempts(key);
    expect(checkLoginRateLimit(key)).toBeNull();
  });
});
