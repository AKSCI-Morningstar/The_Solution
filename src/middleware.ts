import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "morningstar_session";
const REQUEST_ID_HEADER = "x-request-id";

const publicPaths = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/health",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/_next/",
  "/favicon.ico",
];

const publicPageExactPaths = new Set(["/"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // crypto.randomUUID() is the Web Crypto global, not Node's "crypto" module -
  // middleware runs in the Edge runtime, which only supports the former.
  const requestId = request.headers.get(REQUEST_ID_HEADER) ?? crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REQUEST_ID_HEADER, requestId);

  const isPublic =
    publicPaths.some((path) => pathname.startsWith(path) || pathname === path) ||
    publicPageExactPaths.has(pathname);

  if (isPublic) {
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set(REQUEST_ID_HEADER, requestId);
    return response;
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Not authenticated", code: "UNAUTHORIZED" },
        { status: 401, headers: { [REQUEST_ID_HEADER]: requestId } },
      );
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
