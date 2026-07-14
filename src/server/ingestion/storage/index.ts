import { LocalFilesystemStorageAdapter } from "./local-filesystem-storage";
import type { StorageAdapter } from "./storage-adapter";

const globalForStorage = globalThis as unknown as { ingestionStorage: StorageAdapter | undefined };

export const storageAdapter: StorageAdapter =
  globalForStorage.ingestionStorage ?? new LocalFilesystemStorageAdapter();

if (process.env.NODE_ENV !== "production") {
  globalForStorage.ingestionStorage = storageAdapter;
}

export type { StorageAdapter, StorageKey } from "./storage-adapter";
