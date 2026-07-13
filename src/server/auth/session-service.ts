import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/server/db";

const COOKIE_NAME = "morningstar_session";
const SESSION_EXPIRY_HOURS = 24;
const REMEMBER_ME_EXPIRY_DAYS = 30;

interface SessionPayload {
  userId: string;
  sessionId: string;
}

function generateSessionToken(): string {
  return randomBytes(48).toString("hex");
}

export async function createSession(
  userId: string,
  opts?: { rememberMe?: boolean; userAgent?: string; ipAddress?: string },
): Promise<string> {
  const token = generateSessionToken();
  const hours = opts?.rememberMe ? REMEMBER_ME_EXPIRY_DAYS * 24 : SESSION_EXPIRY_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      userId,
      userAgent: opts?.userAgent,
      ipAddress: opts?.ipAddress,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function validateSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session) return null;
  if (session.isRevoked) return null;
  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }

  return { userId: session.userId, sessionId: session.id };
}

export async function renewSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return;

  const session = await prisma.session.findUnique({ where: { token } });
  if (!session || session.isRevoked) return;

  const hours = SESSION_EXPIRY_HOURS;
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000);

  await prisma.session.update({
    where: { id: session.id },
    data: { expiresAt },
  });

  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { token } });
  }

  cookieStore.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function destroyAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}

export { COOKIE_NAME };
