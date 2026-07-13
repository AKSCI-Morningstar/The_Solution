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

export const config = {
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  appUrl: optionalEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  databaseUrl: requireEnv("DATABASE_URL"),

  get isDev(): boolean {
    return this.nodeEnv === "development";
  },

  get isProd(): boolean {
    return this.nodeEnv === "production";
  },

  get isTest(): boolean {
    return this.nodeEnv === "test";
  },
};
