import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { createSession } from "@/server/auth/session-service";
import { setActiveOrganizationId } from "@/server/organizations/organization-context";
import { hashPassword } from "@/server/auth/password-service";

export async function POST() {
  try {
    const email = "demo@aksci.io";

    // 1. Find or create demo user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const passwordHash = hashPassword("Demo123!Password");
      user = await prisma.user.create({
        data: {
          email,
          name: "Guest Demo Engineer",
          passwordHash,
          isEmailVerified: true,
          status: "active",
        },
      });
    }

    // 2. Find or create demo organization
    let org = await prisma.organization.findFirst({
      where: { ownerId: user.id },
    });

    if (!org) {
      org = await prisma.organization.create({
        data: {
          name: "AKSCI Aerospace Demo Org",
          slug: "aksci-demo-org",
          description: "Public Guest Demo Organization",
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              role: "owner",
              status: "active",
            },
          },
        },
      });
    } else {
      // Ensure member relationship exists
      const membership = await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: org.id,
            userId: user.id,
          },
        },
      });

      if (!membership) {
        await prisma.organizationMember.create({
          data: {
            organizationId: org.id,
            userId: user.id,
            role: "owner",
            status: "active",
          },
        });
      }
    }

    // 3. Create session & set active organization cookie
    await createSession(user.id, { rememberMe: true });
    await setActiveOrganizationId(org.id);

    return NextResponse.json({
      data: {
        user: { id: user.id, email: user.email, name: user.name },
        organization: { id: org.id, name: org.name, slug: org.slug },
      },
    });
  } catch (error) {
    console.error("Demo login error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  return POST();
}
