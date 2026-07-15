import { NextResponse } from "next/server";

export function createApiResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json({ data }, { status });
}

export function createPaginatedResponse<T>(
  result: {
    data: T;
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  },
  status: number = 200,
): NextResponse {
  return NextResponse.json(result, { status });
}

export function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, unknown>,
): NextResponse {
  return NextResponse.json({ error: message, code, ...(details ? { details } : {}) }, { status });
}
