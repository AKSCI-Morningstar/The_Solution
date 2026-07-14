export interface StorageKey {
  organizationId: string;
  documentId: string;
  version: number;
  fileName: string;
}

export interface StorageAdapter {
  /** Persists file bytes and returns an opaque storage key used for later reads/deletes. */
  save(key: StorageKey, data: Buffer): Promise<string>;
  read(storageKey: string): Promise<Buffer>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}
