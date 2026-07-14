import { prisma } from "@/server/db";
import { hashPassword, verifyPassword } from "./password-service";
import {
  createSession,
  destroyAllUserSessions,
  destroySession,
  validateSession,
} from "./session-service";
import { createVerificationToken, consumeVerificationToken } from "./token-service";
import {
  loginRateLimiter,
  passwordResetRateLimiter,
  recordSecurityEvent,
  registrationRateLimiter,
} from "@/server/security";
import { AppError, ValidationError, UnauthorizedError, RateLimitedError } from "@/shared/errors";

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
  ipAddress?: string;
}

interface RegisterResult {
  user: { id: string; email: string; name: string | null };
}

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, password, name, ipAddress } = input;

  const ipKey = ipAddress ? `ip:${ipAddress}` : null;
  const ipRetryAfter = ipKey ? registrationRateLimiter.check(ipKey) : null;
  if (ipRetryAfter !== null) {
    throw new RateLimitedError("Too many registration attempts. Try again later.", ipRetryAfter);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (ipKey) registrationRateLimiter.record(ipKey);
    throw new ValidationError({ email: ["Email is already registered"] });
  }

  const passwordHash = hashPassword(password);

  const user = await prisma.user.create({
    data: { email, name, passwordHash },
  });

  if (ipKey) registrationRateLimiter.record(ipKey);

  await prisma.authEvent.create({
    data: { userId: user.id, action: "user.registered", metadata: { email }, ipAddress },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
}

export interface LoginInput {
  email: string;
  password: string;
  rememberMe?: boolean;
  userAgent?: string;
  ipAddress?: string;
}

interface LoginResult {
  user: { id: string; email: string; name: string | null };
}

export async function loginUser(input: LoginInput): Promise<LoginResult> {
  const { email, password, rememberMe, userAgent, ipAddress } = input;

  const emailKey = `email:${email}`;
  const ipKey = ipAddress ? `ip:${ipAddress}` : null;

  const emailRetryAfter = loginRateLimiter.check(emailKey);
  const ipRetryAfter = ipKey ? loginRateLimiter.check(ipKey) : null;
  const retryAfter = emailRetryAfter ?? ipRetryAfter;
  if (retryAfter !== null) {
    await recordSecurityEvent("auth.rate_limited", { ipAddress, userAgent, metadata: { email } });
    throw new RateLimitedError("Too many login attempts. Try again later.", retryAfter);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    loginRateLimiter.record(emailKey);
    if (ipKey) loginRateLimiter.record(ipKey);
    throw new UnauthorizedError("Invalid email or password");
  }

  if (user.status !== "active") {
    loginRateLimiter.record(emailKey);
    if (ipKey) loginRateLimiter.record(ipKey);
    throw new UnauthorizedError("Account is disabled");
  }

  const isValid = verifyPassword(password, user.passwordHash);
  if (!isValid) {
    loginRateLimiter.record(emailKey);
    if (ipKey) loginRateLimiter.record(ipKey);
    await prisma.authEvent.create({
      data: {
        userId: user.id,
        action: "auth.login.failed",
        metadata: { email },
        ipAddress,
        userAgent,
      },
    });
    throw new UnauthorizedError("Invalid email or password");
  }

  loginRateLimiter.clear(emailKey);

  await createSession(user.id, { rememberMe, userAgent, ipAddress });

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await prisma.authEvent.create({
    data: {
      userId: user.id,
      action: "auth.login.success",
      metadata: { email },
      ipAddress,
      userAgent,
    },
  });

  return { user: { id: user.id, email: user.email, name: user.name } };
}

export async function logoutUser(): Promise<void> {
  const payload = await validateSession();
  if (payload) {
    await prisma.authEvent.create({
      data: { userId: payload.userId, action: "auth.logout" },
    });
  }
  await destroySession();
}

export interface CurrentUserResult {
  id: string;
  email: string;
  name: string | null;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

export async function getCurrentUser(): Promise<CurrentUserResult | null> {
  const payload = await validateSession();
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user || user.status !== "active") {
    await destroySession();
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

export async function requestPasswordReset(email: string, ipAddress?: string): Promise<void> {
  const emailKey = `email:${email}`;
  const ipKey = ipAddress ? `ip:${ipAddress}` : null;

  const emailRetryAfter = passwordResetRateLimiter.check(emailKey);
  const ipRetryAfter = ipKey ? passwordResetRateLimiter.check(ipKey) : null;
  if (emailRetryAfter !== null || ipRetryAfter !== null) {
    await recordSecurityEvent("auth.rate_limited", {
      ipAddress,
      metadata: { email, flow: "password_reset" },
    });
    return; // same response shape as success - does not reveal whether the rate limit or the email lookup is why nothing was sent
  }
  passwordResetRateLimiter.record(emailKey);
  if (ipKey) passwordResetRateLimiter.record(ipKey);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  await createVerificationToken(user.id, "password_reset", 1);

  await prisma.authEvent.create({
    data: { userId: user.id, action: "auth.password.reset.requested", ipAddress },
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const result = await consumeVerificationToken(token, "password_reset");
  if (!result) {
    throw new AppError("Invalid or expired reset token", "INVALID_RESET_TOKEN", 400);
  }

  const passwordHash = hashPassword(newPassword);

  await prisma.user.update({
    where: { id: result.userId },
    data: { passwordHash },
  });

  // A leaked/stolen session should not survive a password reset - the whole
  // point of the reset is to lock out whoever had access to the old password.
  await destroyAllUserSessions(result.userId);

  await prisma.authEvent.create({
    data: { userId: result.userId, action: "auth.password.reset.completed" },
  });
}
