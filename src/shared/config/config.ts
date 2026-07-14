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
  ingestionStorageDir: optionalEnv("INGESTION_STORAGE_DIR", "./.data/ingestion-storage"),
  ingestionMaxFileSizeBytes: Number(
    optionalEnv("INGESTION_MAX_FILE_SIZE_BYTES", String(200 * 1024 * 1024)),
  ),

  // Lazy (not eagerly evaluated like the fields above): Prisma reads
  // DATABASE_URL directly from process.env via schema.prisma, so this getter
  // has no real consumer today. Keeping it lazy means importing `config` for
  // an unrelated field (e.g. in a unit test) doesn't require a database URL
  // to be set at all.
  get databaseUrl(): string {
    return requireEnv("DATABASE_URL");
  },

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
