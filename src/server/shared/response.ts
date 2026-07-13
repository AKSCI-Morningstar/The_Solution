export async function createApiResponse<T>(data: T, status: number = 200): Promise<Response> {
  return new Response(JSON.stringify({ data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, unknown>,
): Promise<Response> {
  return new Response(JSON.stringify({ error: message, code, ...(details ? { details } : {}) }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
