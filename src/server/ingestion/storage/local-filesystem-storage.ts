import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { config } from "@/shared/config";
import { AppError } from "@/shared/errors";
import type { StorageAdapter, StorageKey } from "./storage-adapter";

function sanitizeFileName(fileName: string): string {
  const base = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.length > 0 ? base : "file";
}

export class LocalFilesystemStorageAdapter implements StorageAdapter {
  private readonly baseDir: string;

  constructor(baseDir: string = config.ingestionStorageDir) {
    this.baseDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), baseDir);
  }

  private resolveWithinBase(relativePath: string): string {
    const absolute = path.resolve(this.baseDir, relativePath);
    if (!absolute.startsWith(this.baseDir + path.sep) && absolute !== this.baseDir) {
      throw new AppError(
        "Resolved storage path escapes the storage root",
        "STORAGE_PATH_INVALID",
        500,
      );
    }
    return absolute;
  }

  async save(key: StorageKey, data: Buffer): Promise<string> {
    const relativeDir = path.join(key.organizationId, key.documentId, String(key.version));
    const relativePath = path.join(relativeDir, sanitizeFileName(key.fileName));
    const absoluteDir = this.resolveWithinBase(relativeDir);
    const absolutePath = this.resolveWithinBase(relativePath);

    await mkdir(absoluteDir, { recursive: true });
    await writeFile(absolutePath, data);

    return relativePath.split(path.sep).join("/");
  }

  async read(storageKey: string): Promise<Buffer> {
    const absolutePath = this.resolveWithinBase(storageKey);
    return readFile(absolutePath);
  }

  async delete(storageKey: string): Promise<void> {
    const absolutePath = this.resolveWithinBase(storageKey);
    await rm(absolutePath, { force: true });
  }

  async exists(storageKey: string): Promise<boolean> {
    const absolutePath = this.resolveWithinBase(storageKey);
    try {
      await access(absolutePath, fsConstants.F_OK);
      return true;
    } catch {
      return false;
    }
  }
}
