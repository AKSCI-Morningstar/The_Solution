import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, generateNonce } from "@/server/security/csp";

describe("generateNonce", () => {
  it("generates a hex-only string with no separators", () => {
    const nonce = generateNonce();
    expect(nonce).toMatch(/^[0-9a-f]+$/);
    expect(nonce).not.toContain("-");
  });

  it("generates a different nonce on every call", () => {
    const a = generateNonce();
    const b = generateNonce();
    expect(a).not.toBe(b);
  });
});

describe("buildContentSecurityPolicy", () => {
  it("includes the given nonce in script-src", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    expect(policy).toContain("'nonce-abc123'");
  });

  it("defaults every fetch directive to 'self'", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    expect(policy).toContain("default-src 'self'");
    expect(policy).toContain("connect-src 'self'");
    expect(policy).toContain("font-src 'self'");
  });

  it("blocks framing entirely", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    expect(policy).toContain("frame-ancestors 'none'");
  });

  it("disallows plugin/object content", () => {
    const policy = buildContentSecurityPolicy("abc123", true);
    expect(policy).toContain("object-src 'none'");
  });

  it("adds upgrade-insecure-requests only in production", () => {
    const prod = buildContentSecurityPolicy("abc123", true);
    const dev = buildContentSecurityPolicy("abc123", false);
    expect(prod).toContain("upgrade-insecure-requests");
    expect(dev).not.toContain("upgrade-insecure-requests");
  });

  it("allows 'unsafe-eval' only outside production (React dev-mode debugging needs it)", () => {
    const prod = buildContentSecurityPolicy("abc123", true);
    const dev = buildContentSecurityPolicy("abc123", false);
    expect(prod).not.toContain("unsafe-eval");
    expect(dev).toContain("'unsafe-eval'");
  });

  it("never allows 'unsafe-eval' in the production script-src, even accidentally", () => {
    const prod = buildContentSecurityPolicy("abc123", true);
    const scriptSrcLine = prod.split("; ").find((d) => d.startsWith("script-src"));
    expect(scriptSrcLine).not.toContain("unsafe-eval");
  });
});
