import { ConfigurationError } from "@/shared/errors";

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new ConfigurationError(key);
  }
  return value;
}

function optionalEnv(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  NODE_ENV: optionalEnv("NODE_ENV", "development"),
  NEXT_PUBLIC_APP_URL: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
} as const;
