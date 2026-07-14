import { NextResponse } from "next/server";
import type { RateLimitedError } from "@/shared/errors";

/** Shared by every route that can throw RateLimitedError, so the Retry-After header is never forgotten on one route but not another. */
export function rateLimitedResponse(error: RateLimitedError): NextResponse {
  const retryAfterSeconds = (error.details?.retryAfterSeconds as number | undefined) ?? 60;
  return NextResponse.json(
    { error: error.message, code: error.code },
    { status: error.statusCode, headers: { "Retry-After": String(retryAfterSeconds) } },
  );
}
