/**
 * Content-Security-Policy construction, shared by middleware (which sets the
 * response header) and nothing else - this is the one place the policy is
 * defined, so it can never drift between routes.
 *
 * Uses `crypto.randomUUID()` (the Web Crypto global) rather than Node's
 * `crypto` module - this runs in middleware, which executes in the Edge
 * runtime and does not support Node built-ins.
 */

export function generateNonce(): string {
  return crypto.randomUUID().replaceAll("-", "");
}

export function buildContentSecurityPolicy(nonce: string, isProd: boolean): string {
  // React's development build uses eval() for debugging features (stack
  // reconstruction, HMR) - "React will never use eval() in production mode"
  // per React's own warning, so 'unsafe-eval' is scoped to non-production
  // only and never weakens the policy actually served to users.
  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`
    : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval'`;

  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");
  return directives.join("; ");
}
