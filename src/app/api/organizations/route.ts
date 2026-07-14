import { NextResponse } from "next/server";
import { listUserOrganizations, createOrganization } from "@/server/organizations";
import { getActiveOrganizationId } from "@/server/organizations/organization-context";
import { AppError, ValidationError } from "@/shared/errors";

export async function GET() {
  try {
    const [orgs, activeOrganizationId] = await Promise.all([
      listUserOrganizations(),
      getActiveOrganizationId(),
    ]);
    return NextResponse.json({ data: orgs, activeOrganizationId });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Validation failed", details: { name: ["Organization name is required"] } },
        { status: 400 },
      );
    }

    const org = await createOrganization({ name: name.trim(), description });
    return NextResponse.json({ data: org }, { status: 201 });
  } catch (error) {
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message, code: error.code, details: error.details },
        { status: error.statusCode },
      );
    }
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
