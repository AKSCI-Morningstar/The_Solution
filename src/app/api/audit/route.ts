import { listAuditEvents, auditFilterSchema } from "@/server/audit";
import { requireActiveOrganization } from "@/server/organizations/organization-context";
import { requirePermission } from "@/server/rbac";
import { getCurrentUser } from "@/server/auth";
import { AppError } from "@/shared/errors";
import { createErrorResponse, createPaginatedResponse } from "@/server/shared/response";

export async function GET(request: Request) {
  try {
    const orgId = await requireActiveOrganization();
    const user = await getCurrentUser();
    if (!user) {
      return createErrorResponse("Not authenticated", "UNAUTHORIZED", 401);
    }
    await requirePermission(orgId, user.id, "settings:read");

    const url = new URL(request.url);
    const parsed = auditFilterSchema.safeParse(Object.fromEntries(url.searchParams.entries()));
    if (!parsed.success) {
      return createErrorResponse(
        "Validation failed",
        "VALIDATION_ERROR",
        400,
        parsed.error.flatten().fieldErrors as Record<string, unknown>,
      );
    }

    const result = await listAuditEvents(orgId, parsed.data);
    return createPaginatedResponse(result);
  } catch (error) {
    if (error instanceof AppError) {
      return createErrorResponse(error.message, error.code, error.statusCode);
    }
    return createErrorResponse("Internal server error", "INTERNAL_ERROR", 500);
  }
}
