/**
 * Origin-based CSRF defense: state-changing requests (POST/PUT/PATCH/DELETE)
 * must carry an Origin (or, failing that, a Referer) header that matches
 * this app's own origin. This is the same mitigation strategy Next.js's own
 * Server Actions use, and it requires no server-side token store - safe
 * methods (GET/HEAD/OPTIONS) are never subject to it, since they must not
 * have side effects to begin with.
 *
 * SameSite=Lax cookies already block the classic cross-site auto-submitting
 * form attack; this closes the remaining gap (a cross-origin fetch/XHR with
 * credentials, or a same-site-but-cross-origin subdomain attack) that
 * SameSite alone does not cover.
 */

const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export function requiresCsrfCheck(method: string): boolean {
  return UNSAFE_METHODS.has(method.toUpperCase());
}

export interface CsrfCheckInput {
  method: string;
  originHeader: string | null;
  refererHeader: string | null;
  expectedOrigin: string;
}

/** Pure function: no I/O, so it's directly unit-testable without a real Request/NextRequest. */
export function isSameOriginRequest(input: CsrfCheckInput): boolean {
  if (!requiresCsrfCheck(input.method)) return true;

  const candidate = input.originHeader ?? input.refererHeader;
  if (!candidate) return false;

  try {
    const candidateOrigin = new URL(candidate).origin;
    return candidateOrigin === input.expectedOrigin;
  } catch {
    return false;
  }
}
