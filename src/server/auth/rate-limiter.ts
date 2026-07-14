/**
 * In-process sliding-window rate limiter for login attempts - a first line of
 * defense against credential-stuffing/brute-force, not a distributed/durable
 * solution. State lives in this process's memory only: it resets on restart
 * and is not shared across multiple instances behind a load balancer. A
 * production multi-instance deployment should back this with Redis (or an
 * equivalent shared store) instead; this is deliberately the "preparation"
 * layer, not the final word.
 */

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

interface AttemptWindow {
  count: number;
  windowStartedAt: number;
}

const globalForRateLimiter = globalThis as unknown as {
  loginAttempts?: Map<string, AttemptWindow>;
};

const attempts = globalForRateLimiter.loginAttempts ?? new Map<string, AttemptWindow>();
globalForRateLimiter.loginAttempts = attempts;

function currentWindow(key: string): AttemptWindow {
  const existing = attempts.get(key);
  const now = Date.now();
  if (!existing || now - existing.windowStartedAt > WINDOW_MS) {
    const fresh: AttemptWindow = { count: 0, windowStartedAt: now };
    attempts.set(key, fresh);
    return fresh;
  }
  return existing;
}

/** Returns seconds until the window resets if the key is currently rate-limited, otherwise null. */
export function checkLoginRateLimit(key: string): number | null {
  const window = currentWindow(key);
  if (window.count >= MAX_ATTEMPTS) {
    return Math.ceil((window.windowStartedAt + WINDOW_MS - Date.now()) / 1000);
  }
  return null;
}

export function recordFailedLoginAttempt(key: string): void {
  const window = currentWindow(key);
  window.count += 1;
}

export function clearLoginAttempts(key: string): void {
  attempts.delete(key);
}
